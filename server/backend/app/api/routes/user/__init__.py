from fastapi import APIRouter

from .users import router as users_router
from .login import router as login_router

router = APIRouter(prefix="/users", tags=["users"])
router.include_router(users_router)
router.include_router(login_router)

__all__ = ["router"]
