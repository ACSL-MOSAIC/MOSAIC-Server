from fastapi import APIRouter

from .robots import router as robots_router

router = APIRouter(prefix="/robots", tags=["robots"])
router.include_router(robots_router)

__all__ = ["router"]
