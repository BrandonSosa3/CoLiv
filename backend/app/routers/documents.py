# Update app/routers/documents.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.tenant import Tenant
from app.models.property import Property
from app.models.room import Room
from app.models.unit import Unit
from app.schemas.document import DocumentCreate, DocumentResponse
from app.services.file_storage import file_storage
from app.utils.auth import get_current_operator

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    document_type: str = Form(...),
    description: Optional[str] = Form(None),
    property_id: Optional[str] = Form(None),
    tenant_id: Optional[str] = Form(None),
    visible_to_all_tenants: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Upload a document with flexible assignment"""
    
    try:
        print(f"DEBUG: Upload started - file: {file.filename}, property_id: {property_id}")
        
        # Validate that at least property_id is provided
        if not property_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Property must be specified"
            )
        
        print(f"DEBUG: Property validation passed")
        
        # Verify property ownership
        property = db.query(Property).filter(
            Property.id == property_id,
            Property.operator_id == current_user.operator.id
        ).first()
        
        if not property:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found or not authorized"
            )
        
        print(f"DEBUG: Property ownership verified")
        
        # If tenant_id is provided, verify tenant belongs to operator's properties
        if tenant_id:
            print(f"DEBUG: Verifying tenant_id: {tenant_id}")
            tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
            if not tenant:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Tenant not found"
                )
            
            # Verify tenant belongs to operator's property
            if tenant.room_id:
                room = db.query(Room).filter(Room.id == tenant.room_id).first()
                unit = db.query(Unit).filter(Unit.id == room.unit_id).first()
                tenant_property = db.query(Property).filter(Property.id == unit.property_id).first()
                
                if tenant_property.operator_id != current_user.operator.id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Not authorized to assign documents to this tenant"
                    )
            print(f"DEBUG: Tenant verification passed")
        
        print(f"DEBUG: About to upload file to storage")
        # Upload file to storage
        file_info = await file_storage.upload_file(file, folder="documents")
        
        print(f"DEBUG: File uploaded successfully, creating document record")
        # Create document record
        document = Document(
            property_id=property_id,
            tenant_id=tenant_id,
            document_type=document_type,
            title=title,
            description=description,
            filename=file_info["filename"],
            file_url=file_info["file_url"],
            file_size=file_info["file_size"],
            mime_type=file_info["mime_type"],
            visible_to_all_tenants=visible_to_all_tenants
        )
        
        print(f"DEBUG: Adding document to database")
        db.add(document)
        db.commit()
        db.refresh(document)
        
        print(f"DEBUG: Upload completed successfully")
        return document
        
    except Exception as e:
        print(f"DEBUG: Upload failed with error: {str(e)}")
        import traceback
        print(f"DEBUG: Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document: {str(e)}"
        )

@router.get("/property/{property_id}", response_model=List[DocumentResponse])
def get_property_documents(
    property_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get all documents for a property"""
    
    # Verify property ownership
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    documents = db.query(Document).filter(
        Document.property_id == property_id
    ).order_by(Document.created_at.desc()).all()
    
    # Enrich with property and tenant names
    result = []
    for doc in documents:
        doc_dict = {
            "id": doc.id,
            "property_id": doc.property_id,
            "tenant_id": doc.tenant_id,
            "document_type": doc.document_type,
            "title": doc.title,
            "description": doc.description,
            "filename": doc.filename,
            "file_url": doc.file_url,
            "file_size": doc.file_size,
            "mime_type": doc.mime_type,
            "visible_to_all_tenants": doc.visible_to_all_tenants,
            "created_at": doc.created_at,
            "property_name": property.name,
            "tenant_name": None
        }
        
        if doc.tenant_id:
            tenant = db.query(Tenant).filter(Tenant.id == doc.tenant_id).first()
            if tenant:
                from app.models.user import User
                user = db.query(User).filter(User.id == tenant.user_id).first()
                if user:
                    doc_dict["tenant_name"] = f"{user.first_name} {user.last_name}".strip() or user.email
        
        result.append(doc_dict)
    
    return result

@router.get("/", response_model=List[DocumentResponse])
def get_all_operator_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get all documents for operator's properties"""
    
    # Get all operator's properties
    properties = db.query(Property).filter(
        Property.operator_id == current_user.operator.id
    ).all()
    
    property_ids = [str(prop.id) for prop in properties]
    
    documents = db.query(Document).filter(
        Document.property_id.in_(property_ids)
    ).order_by(Document.created_at.desc()).all()
    
    # Enrich with property and tenant names
    result = []
    for doc in documents:
        property = next((p for p in properties if str(p.id) == str(doc.property_id)), None)
        doc_dict = {
            "id": doc.id,
            "property_id": doc.property_id,
            "tenant_id": doc.tenant_id,
            "document_type": doc.document_type,
            "title": doc.title,
            "description": doc.description,
            "filename": doc.filename,
            "file_url": doc.file_url,
            "file_size": doc.file_size,
            "mime_type": doc.mime_type,
            "visible_to_all_tenants": doc.visible_to_all_tenants,
            "created_at": doc.created_at,
            "property_name": property.name if property else "Unknown",
            "tenant_name": None
        }
        
        if doc.tenant_id:
            tenant = db.query(Tenant).filter(Tenant.id == doc.tenant_id).first()
            if tenant:
                from app.models.user import User
                user = db.query(User).filter(User.id == tenant.user_id).first()
                if user:
                    doc_dict["tenant_name"] = f"{user.first_name} {user.last_name}".strip() or user.email
        
        result.append(doc_dict)
    
    return result

@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Delete a document"""
    
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Verify ownership through property
    property = db.query(Property).filter(
        Property.id == document.property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Delete from storage
    # Extract key from file_url for deletion
    try:
        key = document.file_url.split('/')[-2] + '/' + document.file_url.split('/')[-1]
        file_storage.delete_file(key)
    except:
        pass  # Continue even if file deletion fails
    
    db.delete(document)
    db.commit()
    
    return {"message": "Document deleted successfully"}

@router.get("/debug-env")
def debug_env():
    """Debug endpoint to check environment variables"""
    import os
    return {
        "R2_ENDPOINT_URL": os.getenv("R2_ENDPOINT_URL", "NOT_SET"),
        "R2_ACCESS_KEY_ID": os.getenv("R2_ACCESS_KEY_ID", "NOT_SET"),
        "R2_SECRET_ACCESS_KEY": "***" if os.getenv("R2_SECRET_ACCESS_KEY") else "NOT_SET",
        "R2_BUCKET_NAME": os.getenv("R2_BUCKET_NAME", "NOT_SET"),
    }

@router.get("/download/{document_id}")
def download_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Generate a secure download URL for a document"""
    
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Verify ownership through property
    property = db.query(Property).filter(
        Property.id == document.property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Generate signed URL (expires in 1 hour)
    download_url = file_storage.generate_download_url(document.file_url)
    
    return {"download_url": download_url}