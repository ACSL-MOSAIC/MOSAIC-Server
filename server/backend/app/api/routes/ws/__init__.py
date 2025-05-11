from fastapi import APIRouter

from .robots_rtc import router as robots_rtc_router
from .user_rtc import router as user_rtc_router

router = APIRouter(prefix="/ws", tags=["ws"])
router.include_router(robots_rtc_router)
router.include_router(user_rtc_router)

__all__ = ["router"]
