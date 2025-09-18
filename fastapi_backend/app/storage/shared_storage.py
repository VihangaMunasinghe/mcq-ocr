import json
import os
import zipfile
import aiofiles
import shutil
from typing import Optional

from pathlib import Path

class SharedStorage:
    _instance: Optional['SharedStorage'] = None
    _initialized: bool = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SharedStorage, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        self.shared_path = os.getenv('NFS_SHARED_PATH', '/shared')
        self.base_path = Path(self.shared_path)

    def get_shared_path(self):
        return self.shared_path

    def get_base_path(self):
        return self.base_path
    
    async def save_file(self, file_content: bytes, file_path: str):
        full_path = self.base_path / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(full_path, 'wb') as f:
            await f.write(file_content)

    async def get_file(self, file_path: str):
        async with aiofiles.open(self.base_path / file_path, 'rb') as f:
            return await f.read()

    async def save_chunk(self, chunk_content: bytes, file_path: str, chunk_index: int):
        chunk_dir = self.base_path / file_path
        chunk_dir.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(chunk_dir / f"chunk_{chunk_index:04d}", 'wb') as f:
            await f.write(chunk_content)

    async def get_chunk(self, file_path: str, chunk_index: int):
        async with aiofiles.open(self.base_path / file_path / f"chunk_{chunk_index:04d}", 'rb') as f:
            return await f.read()

    async def combine_chunks(self, temp_dir: str, total_chunks: int, final_path: str):
        final_path_obj = Path(final_path)
        final_path_obj.parent.mkdir(parents=True, exist_ok=True)
        
        async with aiofiles.open(final_path, 'wb') as final_file:
            for chunk_index in range(total_chunks):
                chunk_path = Path(temp_dir) / f"chunk_{chunk_index:04d}"
                if not chunk_path.exists():
                    raise FileNotFoundError(f"Chunk {chunk_index} not found")
                
                async with aiofiles.open(chunk_path, 'rb') as chunk_file:
                    while chunk := await chunk_file.read(8192):
                        await final_file.write(chunk)

    async def update_chunks_received_metadata(self, file_path: str, metadata: dict, chunk_index: int):
        metadata_path = self.base_path / file_path / "metadata.json"
        if metadata_path.exists():
            async with aiofiles.open(metadata_path, 'r') as f:
                metadata = json.loads(await f.read())
        
        metadata["chunks_received"].append(chunk_index)
        
        async with aiofiles.open(metadata_path, 'w') as f:
            await f.write(json.dumps(metadata, indent=2))

    async def get_metadata(self, file_path: str):
        metadata_path = self.base_path / file_path / "metadata.json"
        if metadata_path.exists():
            async with aiofiles.open(metadata_path, 'r') as f:
                return json.loads(await f.read())
        return None
    
    async def delete_directory(self, file_path: str):
        shutil.rmtree(self.base_path / file_path)
    
    async def delete_file(self, file_path: str):
        os.remove(self.base_path / file_path)

    async def unzip_file(self, file_path: str):
        try:   
            with zipfile.ZipFile(self.base_path / file_path, 'r') as zip_ref:
                folder_path = self.base_path / file_path.replace('.zip', '')
                folder_path.mkdir(parents=True, exist_ok=True)
                zip_ref.extractall(folder_path)
                await self.delete_file(file_path)
                final_path = f"{file_path.replace('.zip', '')}/{zip_ref.namelist()[0]}"
        except Exception as e:
            raise Exception(f"Failed to unzip file: {str(e)}")

        return str(final_path)