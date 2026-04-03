import shutil
import uuid
import os
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from ...core.config import settings
from .deps import get_current_user
from ...models.user import User

router = APIRouter()

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload a file and return the access URL."""
    try:
        ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Use settings.API_BASE_URL for consistent routing
        file_url = f"{settings.API_BASE_URL}/uploads/{unique_filename}"
        
        return {"url": file_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
