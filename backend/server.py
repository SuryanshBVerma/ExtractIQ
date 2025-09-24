from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
from api import health, lang_extract, document, schema
from middleware.test_middleware import TestMiddleware
from dotenv import load_dotenv
import os
from config.cors_config import init_cors
from config.db import startup_db_client, shutdown_db_client, db_client

load_dotenv()


app = FastAPI(title="ExtractIQ", description='Backend for ExtractIQ', version='1.0.0')

init_cors(app)

# app.add_middleware(TestMiddleware)

@app.on_event("startup")
async def on_startup():
    await startup_db_client()

@app.on_event("shutdown")
async def on_shutdown():
    await shutdown_db_client()

@app.get('/')
async def root():
    return {'status': 'Online', 'message': 'Voicera backend is running', 'version': app.version}

app.include_router(health.router, prefix='/api')
app.include_router(lang_extract.router, prefix='/api')
app.include_router(document.router, prefix='/api')
app.include_router(schema.router, prefix='/api')


if __name__ == '__main__':
    uvicorn.run('server:app', host='0.0.0.0', port=8000, reload=True)