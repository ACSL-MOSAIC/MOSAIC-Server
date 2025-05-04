from fastapi import APIRouter

from .items import router as items_router

router = APIRouter(prefix="/items", tags=["items"])
router.include_router(items_router)

__all__ = ["router"]
