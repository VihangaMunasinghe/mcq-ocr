import os
import shutil
from pathlib import Path
from typing import Optional, List, Union
from datetime import datetime
import json

class NFSStorage:
    _instance: Optional['NFSStorage'] = None
    _initialized: bool = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(NFSStorage, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        # Only initialize once
        if not self._initialized:
            self.shared_path = os.getenv('NFS_SHARED_PATH', '/shared')
            self.base_path = Path(self.shared_path)
            
            # Create base directory structure
            self._create_directory_structure()
            self._initialized = True

    def _create_directory_structure(self):
        """Create the base directory structure for the MCQ marking system"""
        directories = [
            'uploads',           # Raw uploaded files
            'intermediate',         # Intermediate files
            'templates',         # Answer sheet templates
            'results',          # Marking results
            'reports',          # Generated reports
            'temp',             # Temporary files
            'backups'           # Backup files
        ]
        
        for directory in directories:
            dir_path = self.base_path / directory
            dir_path.mkdir(parents=True, exist_ok=True)
            
            # Create subdirectories for better organization
            if directory == 'uploads':
                (dir_path / 'answer_sheets').mkdir(exist_ok=True)
                (dir_path / 'marking_schemes').mkdir(exist_ok=True)
                (dir_path / 'templates').mkdir(exist_ok=True)
            elif directory == 'intermediate':
                (dir_path / 'answer_sheets').mkdir(exist_ok=True)
                (dir_path / 'templates').mkdir(exist_ok=True)

    def save_file(self, file_content: bytes, file_path: str, 
                  file_type: str = 'general', metadata: dict = None) -> str:
        """
        Save file content to NFS storage with organized structure
        
        Args:
            file_content: File content as bytes
            file_path: Relative path within the file_type directory
            file_type: Type of file (uploads, processed, templates, etc.)
            metadata: Optional metadata to save alongside the file
            
        Returns:
            Full path to the saved file
        """
        # Determine the target directory based on file type
        target_dir = self.base_path / file_type
        target_dir.mkdir(parents=True, exist_ok=True)
        
        # Create the full file path
        full_path = target_dir / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Save the file
        with open(full_path, 'wb') as f:
            f.write(file_content)
        
        # Save metadata if provided
        if metadata:
            metadata_path = full_path.with_suffix(full_path.suffix + '.meta')
            metadata['saved_at'] = datetime.now().isoformat()
            metadata['file_size'] = len(file_content)
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
        
        return str(full_path)

    def get_file(self, file_path: str, file_type: str = 'general') -> bytes:
        """
        Get file content from NFS storage
        
        Args:
            file_path: Relative path within the file_type directory
            file_type: Type of file directory
            
        Returns:
            File content as bytes
        """
        full_path = self.base_path / file_type / file_path
        with open(full_path, 'rb') as f:
            return f.read()

    def get_file_metadata(self, file_path: str, file_type: str = 'general') -> dict:
        """Get file metadata"""
        full_path = self.base_path / file_type / file_path
        metadata_path = full_path.with_suffix(full_path.suffix + '.meta')
        
        if metadata_path.exists():
            with open(metadata_path, 'r') as f:
                return json.load(f)
        return {}

    def list_files(self, file_type: str = 'general', 
                   subdirectory: str = None, 
                   pattern: str = "*") -> List[str]:
        """
        List files in the specified directory
        
        Args:
            file_type: Type of file directory
            subdirectory: Optional subdirectory within file_type
            pattern: File pattern to match (e.g., "*.pdf", "*.jpg")
            
        Returns:
            List of relative file paths
        """
        target_dir = self.base_path / file_type
        if subdirectory:
            target_dir = target_dir / subdirectory
        
        if not target_dir.exists():
            return []
        
        files = []
        for file_path in target_dir.rglob(pattern):
            if file_path.is_file() and not file_path.name.endswith('.meta'):
                # Return relative path from the file_type directory
                relative_path = file_path.relative_to(target_dir)
                files.append(str(relative_path))
        
        return sorted(files)

    def delete_file(self, file_path: str, file_type: str = 'general') -> bool:
        """
        Delete file from NFS storage
        
        Args:
            file_path: Relative path within the file_type directory
            file_type: Type of file directory
            
        Returns:
            True if file was deleted, False if file didn't exist
        """
        full_path = self.base_path / file_type / file_path
        metadata_path = full_path.with_suffix(full_path.suffix + '.meta')
        
        deleted = False
        if full_path.exists():
            full_path.unlink()
            deleted = True
        
        if metadata_path.exists():
            metadata_path.unlink()
        
        return deleted

    def copy_file(self, source_path: str, source_type: str,
                  dest_path: str, dest_type: str) -> str:
        """
        Copy file within NFS storage
        
        Args:
            source_path: Source file relative path
            source_type: Source file type directory
            dest_path: Destination file relative path
            dest_type: Destination file type directory
            
        Returns:
            Full path to the copied file
        """
        source_full = self.base_path / source_type / source_path
        dest_full = self.base_path / dest_type / dest_path
        dest_full.parent.mkdir(parents=True, exist_ok=True)
        
        shutil.copy2(source_full, dest_full)
        
        # Copy metadata if it exists
        source_meta = source_full.with_suffix(source_full.suffix + '.meta')
        dest_meta = dest_full.with_suffix(dest_full.suffix + '.meta')
        if source_meta.exists():
            shutil.copy2(source_meta, dest_meta)
        
        return str(dest_full)

    def move_file(self, source_path: str, source_type: str,
                  dest_path: str, dest_type: str) -> str:
        """
        Move file within NFS storage
        
        Args:
            source_path: Source file relative path
            source_type: Source file type directory
            dest_path: Destination file relative path
            dest_type: Destination file type directory
            
        Returns:
            Full path to the moved file
        """
        source_full = self.base_path / source_type / source_path
        dest_full = self.base_path / dest_type / dest_path
        dest_full.parent.mkdir(parents=True, exist_ok=True)
        
        shutil.move(str(source_full), str(dest_full))
        
        # Move metadata if it exists
        source_meta = source_full.with_suffix(source_full.suffix + '.meta')
        dest_meta = dest_full.with_suffix(dest_full.suffix + '.meta')
        if source_meta.exists():
            shutil.move(str(source_meta), str(dest_meta))
        
        return str(dest_full)

    def create_directory(self, dir_path: str, file_type: str = 'general') -> str:
        """
        Create directory in NFS storage
        
        Args:
            dir_path: Relative directory path
            file_type: Type of file directory
            
        Returns:
            Full path to the created directory
        """
        full_path = self.base_path / file_type / dir_path
        full_path.mkdir(parents=True, exist_ok=True)
        return str(full_path)

    def get_directory_structure(self, file_type: str = 'general') -> dict:
        """
        Get directory structure as a nested dictionary
        
        Args:
            file_type: Type of file directory
            
        Returns:
            Nested dictionary representing the directory structure
        """
        target_dir = self.base_path / file_type
        
        def build_tree(path: Path) -> dict:
            tree = {}
            if path.is_dir():
                for item in sorted(path.iterdir()):
                    if item.is_dir():
                        tree[item.name] = build_tree(item)
                    else:
                        tree[item.name] = {
                            'type': 'file',
                            'size': item.stat().st_size,
                            'modified': datetime.fromtimestamp(item.stat().st_mtime).isoformat()
                        }
            return tree
        
        return build_tree(target_dir)

    def get_storage_info(self) -> dict:
        """Get storage usage information"""
        total_size = 0
        file_count = 0
        
        for root, dirs, files in os.walk(self.base_path):
            for file in files:
                if not file.endswith('.meta'):
                    file_path = Path(root) / file
                    total_size += file_path.stat().st_size
                    file_count += 1
        
        return {
            'total_size_bytes': total_size,
            'total_size_mb': round(total_size / (1024 * 1024), 2),
            'file_count': file_count,
            'base_path': str(self.base_path),
            'available_space': shutil.disk_usage(self.base_path).free
        }
