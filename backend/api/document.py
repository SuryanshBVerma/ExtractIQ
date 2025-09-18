from fastapi import APIRouter, UploadFile, File
import shutil

import os

router = APIRouter()

@router.post("/upload/document")
async def upload_document(file: UploadFile = File(...)):
    file_path = f"db/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename, "content_type": file.content_type}

@router.get("/documents")
async def get_documents():
    files = os.listdir("db")
    return {"documents": files}
