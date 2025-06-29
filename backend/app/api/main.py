from fastapi import APIRouter

from app.api.routes.user import router as user_router
from app.api.routes.robots import router as robots_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.utils import router as utils_router
from app.api.routes.private import router as private_router
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(user_router)
api_router.include_router(utils_router)
api_router.include_router(robots_router)
api_router.include_router(dashboard_router)

if settings.ENVIRONMENT == "local":
    api_router.include_router(private_router)
