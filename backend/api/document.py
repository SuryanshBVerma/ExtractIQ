from fastapi import APIRouter, UploadFile, File, Depends
from config.db import get_db
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
    documents = []
    for idx, file in enumerate(files, start=1):
        documents.append({
            "id": idx,
            "name": file,
            "uploaded": "2025-09-10",
            "status": "Processed"
        })
    return {"documents": documents}


@router.post("/trial")
async def add_document_to_db(document: dict, db = Depends(get_db)):
    collection = db["Documents"]
    result = await collection.insert_one(document)
    return {"inserted_id": str(result.inserted_id)}
