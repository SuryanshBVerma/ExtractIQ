from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from config.db import get_db
from bson import ObjectId
import time

router = APIRouter()

# Pydantic models for Schema CRUD
class Attribute(BaseModel):
    pass  # Dynamic attributes as dict

class Extraction(BaseModel):
    extraction_class: str
    extraction_text: str
    attributes: Dict[str, Any]
    color: str

class Example(BaseModel):
    text: str
    extractions: List[Extraction]

class Schema(BaseModel):
    prompt: str
    examples: List[Example]

class SchemaResponse(BaseModel):
    id: str  # MongoDB ObjectId as string
    prompt: str
    examples: List[Example]

# CRUD Operations for Schemas

@router.post("/schemas", response_model=SchemaResponse)
async def create_schema(schema: Schema, db = Depends(get_db)):
    """Create a new schema"""
    try:
        collection = db.schemas
        
        schema_dict = schema.dict()
        
        result = await collection.insert_one(schema_dict)
        
        if result.inserted_id:
            # Return the created schema with ObjectId as string
            created_schema = await collection.find_one({"_id": result.inserted_id}, {"_id": 0})
            created_schema["id"] = str(result.inserted_id)
            return SchemaResponse(**created_schema)
        else:
            raise HTTPException(status_code=500, detail="Failed to create schema")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating schema: {str(e)}")

@router.get("/schemas", response_model=List[SchemaResponse])
async def get_all_schemas(db = Depends(get_db)):
    """Get all schemas"""
    try:
        collection = db.schemas
        cursor = collection.find({}, {"_id": 1, "prompt": 1, "examples": 1})
        schemas = await cursor.to_list(length=None)
        
        # Convert ObjectId to string for each schema
        schema_responses = []
        for schema in schemas:
            schema["id"] = str(schema.pop("_id"))
            schema_responses.append(SchemaResponse(**schema))
        
        return schema_responses
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching schemas: {str(e)}")

@router.get("/schemas/{schema_id}", response_model=SchemaResponse)
async def get_schema_by_id(schema_id: str, db = Depends(get_db)):
    """Get a specific schema by ObjectId"""
    try:
        collection = db.schemas
        
        # Validate ObjectId format
        if not ObjectId.is_valid(schema_id):
            raise HTTPException(status_code=400, detail="Invalid schema ID format")
        
        schema = await collection.find_one({"_id": ObjectId(schema_id)}, {"_id": 1, "prompt": 1, "examples": 1})
        
        if not schema:
            raise HTTPException(status_code=404, detail=f"Schema with ID {schema_id} not found")
        
        # Convert ObjectId to string
        schema["id"] = str(schema.pop("_id"))
        return SchemaResponse(**schema)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching schema: {str(e)}")

@router.put("/schemas/{schema_id}", response_model=SchemaResponse)
async def update_schema(schema_id: str, schema: Schema, db = Depends(get_db)):
    """Update an existing schema"""
    try:
        collection = db.schemas
        
        # Validate ObjectId format
        if not ObjectId.is_valid(schema_id):
            raise HTTPException(status_code=400, detail="Invalid schema ID format")
        
        schema_dict = schema.dict()
        
        result = await collection.replace_one(
            {"_id": ObjectId(schema_id)}, 
            schema_dict
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail=f"Schema with ID {schema_id} not found")
        
        # Return updated schema with ObjectId as string
        schema_dict["id"] = schema_id
        return SchemaResponse(**schema_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating schema: {str(e)}")

@router.delete("/schemas/{schema_id}")
async def delete_schema(schema_id: str, db = Depends(get_db)):
    """Delete a schema by ObjectId"""
    try:
        collection = db.schemas
        
        # Validate ObjectId format
        if not ObjectId.is_valid(schema_id):
            raise HTTPException(status_code=400, detail="Invalid schema ID format")
        
        result = await collection.delete_one({"_id": ObjectId(schema_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail=f"Schema with ID {schema_id} not found")
        
        return {"message": f"Schema with ID {schema_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting schema: {str(e)}")

@router.get("/schemas/{schema_id}/examples", response_model=List[Example])
async def get_schema_examples(schema_id: str, db = Depends(get_db)):
    """Get all examples for a specific schema"""
    try:
        collection = db.schemas
        
        # Validate ObjectId format
        if not ObjectId.is_valid(schema_id):
            raise HTTPException(status_code=400, detail="Invalid schema ID format")
        
        schema = await collection.find_one({"_id": ObjectId(schema_id)}, {"_id": 0, "examples": 1})
        
        if not schema:
            raise HTTPException(status_code=404, detail=f"Schema with ID {schema_id} not found")
        
        return schema.get("examples", [])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching schema examples: {str(e)}")