from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from config.db import get_db
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from datetime import datetime
import shutil
import os
from fastapi.responses import StreamingResponse
from io import BytesIO
from bson import ObjectId

router = APIRouter()

@router.post("/upload/document")
async def upload_document(file: UploadFile = File(...), db = Depends(get_db)):
    
    # Validate file type
    if not file.filename.lower().endswith(('.pdf', '.doc', '.docx', '.txt')):
        raise HTTPException(status_code=400, detail="Invalid file type")

    fs = AsyncIOMotorGridFSBucket(db)
    
    # Read file content
    content = await file.read()

    try:
        # Upload file to GridFS
        upload_stream = fs.open_upload_stream(
            filename=file.filename,
            metadata={
                "content_type": file.content_type,
                "uploaded_at": datetime.now()
            }
        )
        
        await upload_stream.write(content)
        await upload_stream.close()  # Important: close the stream to complete upload
        
        file_id = upload_stream._id
        
        # Store metadata separately
        metadata = {
            "name": file.filename,
            "uploaded": datetime.now(),
            "status": "UPLOADED",
            "file_id": file_id,
            "content_type": file.content_type,
            "size": len(content)
        }

        result = await db["Documents"].insert_one(metadata)
        
        # Prepare response data
        response_data = {
            "id": str(result.inserted_id),
            "name": file.filename,
            "uploaded": metadata["uploaded"].isoformat(),
            "status": "UPLOADED",
            "file_id": str(file_id),
            "content_type": file.content_type,
            "size": len(content)
        }
        
        return response_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@router.get("/documents")
async def get_documents(db = Depends(get_db)):
    cursor = db["Documents"].find()
    documents = []
    async for doc in cursor:
        documents.append({
            "id": str(doc.get("_id")),
            "name": doc.get("name"),
            "uploaded": doc.get("uploaded").isoformat() if doc.get("uploaded") else None,
            "status": doc.get("status"),
            "file_id": str(doc.get("file_id")) if doc.get("file_id") else None,
            "content_type": doc.get("content_type"),
            "size": doc.get("size")
        })
    return {"documents": documents}

@router.get("/document/download/{document_id}")
async def download_document(document_id: str, db = Depends(get_db)):
    try:
        # Get document metadata
        document = await db["Documents"].find_one({"_id": ObjectId(document_id)})
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Get file from GridFS
        fs = AsyncIOMotorGridFSBucket(db)
        file_id = document["file_id"]
        
        grid_out = await fs.open_download_stream(file_id)
        contents = await grid_out.read()
        
        return StreamingResponse(
            BytesIO(contents),
            media_type=document["content_type"],
            headers={
                "Content-Disposition": f'attachment; filename="{document["name"]}"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading file: {str(e)}")


