from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
from api import health, lang_extract
from middleware.test_middleware import TestMiddleware
from dotenv import load_dotenv
import os

load_dotenv()


app = FastAPI(title="ExtractIQ", description='Backend for ExtractIQ', version='1.0.0')


app.add_middleware(TestMiddleware)

@app.get('/')
async def root():
    return {'status': 'Online', 'message': 'Voicera backend is running', 'version': app.version}

app.include_router(health.router, prefix='/api')
app.include_router(lang_extract.router, prefix='/api')


if __name__ == '__main__':
    uvicorn.run('server:app', host='0.0.0.0', port=8000, reload=True)