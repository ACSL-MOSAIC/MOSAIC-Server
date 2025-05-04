from fastapi import APIRouter

from app.api.routes.user import router as user_router
from app.api.routes.items import router as items_router
from app.api.routes.utils import router as utils_router
from app.api.routes.private import router as private_router
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(user_router)
api_router.include_router(utils_router)
api_router.include_router(items_router)

if settings.ENVIRONMENT == "local":
    api_router.include_router(private_router)
