import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException, Query, BackgroundTasks, Form
from fastapi.responses import StreamingResponse
from typing import List
import uuid
from pathlib import Path
from app.schemas.file import FileResponse, FileUploadResponse
from app.storage.shared_storage import SharedStorage

router = APIRouter(prefix="/files", tags=["files"])

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(file: UploadFile = File(...),
    file_type: str = Form(...)):
    """
    Upload a file to the system
    """
    # TODO: Get user ID from token
    user_id = 1
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    

    file_id = str(uuid.uuid4())
    upload_dir = f'uploads/{file_type}s/{user_id}'
    final_path = f"{upload_dir}/{file_id}_{file.filename}"

    # Read file content as bytes
    file_content = await file.read()
    
    shared_storage = SharedStorage()
    await shared_storage.save_file(file_content, final_path)
    
    return FileUploadResponse(
        message="File uploaded successfully",
        filename=file.filename,
        file_id=file_id,
        path=final_path,
        file_size=file.size
    )

@router.post("/upload/zip", response_model=FileUploadResponse)
async def upload_zip_file(file: UploadFile = File(...), folder: str = Query(...)):
    """
    Upload a zip file to the system
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # TODO: Implement zip file upload logic
    return FileUploadResponse(
        message="Zip file uploaded successfully",
        filename=file.filename,
        file_id="temp_id"
    )

# Chunked upload endpoints for very large files
@router.post("/upload/large/chunk")
async def upload_chunk(
    file: UploadFile = File(...),
    upload_id: str = Form(...),
    chunk_index: int = Form(...),
    total_chunks: int = Form(...),
    original_name: str = Form(...),
    save_path: str = Form(...),
    file_type: str = Form(...)
):
    """
    Upload a single chunk of a large file
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Create temporary directory for chunks
    temp_dir = Path(f"temp/uploads/{upload_id}")
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    # Save chunk to temporary file
    chunk_path = temp_dir / f"chunk_{chunk_index:04d}"
    
    try:
        # Read chunk content as bytes
        chunk_content = await file.read()
        
        shared_storage = SharedStorage()
        await shared_storage.save_chunk(chunk_content, chunk_path, chunk_index)
        
        # Save upload metadata
        metadata = {
            "upload_id": upload_id,
            "original_name": original_name,
            "total_chunks": total_chunks,
            "file_type": file_type,
            "save_path": save_path,
            "chunks_received": [],
            "created_at": datetime.now().isoformat()
        }
        
        await shared_storage.update_chunks_received_metadata(temp_dir, metadata, chunk_index)
        
        return {
            "message": f"Chunk {chunk_index + 1}/{total_chunks} uploaded successfully",
            "chunk_index": chunk_index,
            "total_chunks": total_chunks,
            "upload_id": upload_id
        }
        
    except Exception as e:
        # Clean up failed chunk
        if chunk_path.exists():
            chunk_path.unlink()
        raise HTTPException(status_code=500, detail=f"Chunk upload failed: {str(e)}")

@router.post("/upload/large/finalize", response_model=FileUploadResponse)
async def finalize_upload(
    upload_id: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    Finalize chunked upload by combining all chunks
    """
    # TODO: Get user ID from token
    user_id = 1

    temp_dir = Path(f"temp/uploads/{upload_id}")
    
    if not temp_dir.exists():
        raise HTTPException(status_code=404, detail="Upload session not found")
    
    try:
        # Load metadata
        shared_storage = SharedStorage()
        metadata = await shared_storage.get_metadata(temp_dir)
        
        original_name = metadata["original_name"]
        total_chunks = metadata["total_chunks"]
        file_type = metadata["file_type"]
        chunks_received = metadata["chunks_received"]
        
        # Check if all chunks are received
        if len(chunks_received) != total_chunks:
            missing_chunks = set(range(total_chunks)) - set(chunks_received)
            raise HTTPException(
                status_code=400, 
                detail=f"Missing chunks: {sorted(missing_chunks)}"
            )
        
        # Generate final file ID and path
        file_id = str(uuid.uuid4())
        upload_dir = f'uploads/{file_type}s/{user_id}'
        final_path = f"{upload_dir}/{file_id}_{original_name}"
        
        # Combine all chunks
        try:
            await shared_storage.combine_chunks(temp_dir, total_chunks, final_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to combine chunks: {str(e)}")
        
        # Get final file size
        file_size = final_path.stat().st_size
        
        # Clean up temporary files
        await shared_storage.delete_directory(temp_dir)
        
        # Process file in background
        # background_tasks.add_task(process_large_file, final_path, file_id)
        
        return FileUploadResponse(
            message="Chunked upload completed successfully",
            filename=original_name,
            file_id=file_id,
            file_size=file_size,
            path=final_path
        )
        
    except HTTPException:
        raise
    except Exception as e:
        # Clean up on error
        if temp_dir.exists():
            await shared_storage.delete_directory(temp_dir)
        raise HTTPException(status_code=500, detail=f"Upload finalization failed: {str(e)}")

@router.delete("/upload/cancel/{upload_id}")
async def cancel_upload(upload_id: str):
    """
    Cancel a chunked upload and clean up temporary files
    """
    temp_dir = Path(f"temp/uploads/{upload_id}")
    
    if not temp_dir.exists():
        raise HTTPException(status_code=404, detail="Upload session not found")

    shared_storage = SharedStorage()
    try:
        await shared_storage.delete_directory(temp_dir)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel upload: {str(e)}")

    return {"message": "Upload cancelled and cleaned up successfully"}

@router.get("/", response_model=List[FileResponse])
async def list_files(folder: str = Query(None)):
    """
    List all uploaded files
    """
    # TODO: Implement file listing logic
    return []

@router.get("/{file_id}", response_model=FileResponse)
async def get_file(file_id: str):
    """
    Get file details by ID
    """
    # TODO: Implement file retrieval logic
    raise HTTPException(status_code=404, detail="File not found")

@router.delete("/{file_id}")
async def delete_file(file_id: str):
    """
    Delete a file by ID
    """
    # TODO: Implement file deletion logic
    return {"message": "File deleted successfully"}
