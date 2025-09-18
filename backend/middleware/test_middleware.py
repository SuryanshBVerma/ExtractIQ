from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from utils.test_util import test_util

class TestMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        print("Middleware is running!")
        test_util()
        response: Response = await call_next(request)
        return response