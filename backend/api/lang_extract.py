from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import langextract as lx
import os

from typing import List, Optional

from langextract.data import ExampleData, Extraction

router = APIRouter()
API_KEY = os.getenv("API_KEY")

class ExtractRequest(BaseModel):
    text: str
    prompt: str
    model_id: str | None = "gemini-1.5-flash"
    examples: List[dict]
    
class ExtractFromDocumentRequest(BaseModel):
    filename: str
    prompt: str
    model_id: str | None = "gemini-1.5-flash"
    examples: List[dict]


@router.post("/extract")
async def extract(req: ExtractRequest):
    examples = [ExampleData(
        text=ex["text"],
        extractions=[Extraction(**e) for e in ex["extractions"]]
    ) for ex in req.examples]

    results = lx.extract(
        text_or_documents=req.text,
        prompt_description=req.prompt,
        model_id=req.model_id,
        examples=examples,
        
    )
    return results

@router.post("/extract/document")
async def extract_from_document(req: ExtractFromDocumentRequest):
    file_path = f"db/{req.filename}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    with open(file_path, "r") as f:
        text = f.read()

    examples = [ExampleData(
        text=ex["text"],
        extractions=[Extraction(**e) for e in ex["extractions"]]
    ) for ex in req.examples]

    results = lx.extract(
        api_key=API_KEY,
        text_or_documents=text,
        prompt_description=req.prompt,
        model_id=req.model_id,
        examples=examples,
    )
    return results