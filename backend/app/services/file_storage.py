# Create app/services/file_storage.py
import boto3
from botocore.exceptions import ClientError
import os
import uuid
from typing import Optional
from fastapi import UploadFile, HTTPException

class FileStorageService:
    def __init__(self):
        self.endpoint_url = os.getenv("R2_ENDPOINT_URL")
        self.access_key = os.getenv("R2_ACCESS_KEY_ID") 
        self.secret_key = os.getenv("R2_SECRET_ACCESS_KEY")
        self.bucket_name = os.getenv("R2_BUCKET_NAME")
        
        self.s3_client = boto3.client(
            's3',
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name='auto'  # Cloudflare R2 uses 'auto'
        )
    
    async def upload_file(self, file: UploadFile, folder: str = "documents") -> dict:
        """Upload file to R2 and return file info"""
        try:
            # Generate unique filename
            file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
            unique_filename = f"{uuid.uuid4()}.{file_extension}" if file_extension else str(uuid.uuid4())
            key = f"{folder}/{unique_filename}"
            
            # Read file content
            content = await file.read()
            
            # Upload to R2
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=content,
                ContentType=file.content_type or 'application/octet-stream'
            )
            
            # Generate public URL
            file_url = f"{self.endpoint_url.replace('https://', 'https://pub-')}/{self.bucket_name}/{key}"
            
            return {
                "filename": file.filename,
                "unique_filename": unique_filename,
                "file_url": file_url,
                "file_size": len(content),
                "mime_type": file.content_type,
                "key": key
            }
            
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
    
    def delete_file(self, key: str) -> bool:
        """Delete file from R2"""
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=key)
            return True
        except ClientError:
            return False

# Create singleton instance
file_storage = FileStorageService()