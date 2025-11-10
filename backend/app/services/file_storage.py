# Create/Update app/services/file_storage.py
import uuid
from typing import Optional
from fastapi import UploadFile, HTTPException

class MockFileStorageService:
    """Mock file storage for testing - saves files locally/in memory"""
    
    async def upload_file(self, file: UploadFile, folder: str = "documents") -> dict:
        """Mock file upload - just return fake file info"""
        try:
            # Read file content to get size
            content = await file.read()
            
            # Generate mock file info
            unique_filename = f"{uuid.uuid4()}.{file.filename.split('.')[-1]}" if '.' in file.filename else str(uuid.uuid4())
            
            return {
                "filename": file.filename,
                "unique_filename": unique_filename,
                "file_url": f"https://mock-storage.com/{folder}/{unique_filename}",
                "file_size": len(content),
                "mime_type": file.content_type,
                "key": f"{folder}/{unique_filename}"
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Mock file upload failed: {str(e)}")
    
    def delete_file(self, key: str) -> bool:
        """Mock file deletion"""
        return True

# Create singleton instance
file_storage = MockFileStorageService()