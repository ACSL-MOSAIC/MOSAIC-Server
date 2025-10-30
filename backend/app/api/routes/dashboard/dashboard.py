from typing import Any

from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, SessionDep
from app.repositories.dashboard_repository import DashboardRepository
from app.schemas.dashboard import DashboardCreate, DashboardPublic

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/", response_model=DashboardPublic)
def read_dashboard(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    현재 사용자의 대시보드 설정 조회
    """
    dashboard_repo = DashboardRepository(session)
    dashboard = dashboard_repo.get_by_user(current_user.id)

    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    return dashboard


@router.post("/", response_model=DashboardPublic)
def upsert_dashboard(
    *, session: SessionDep, current_user: CurrentUser, dashboard_in: DashboardCreate
) -> Any:
    """
    대시보드 설정 upsert (있으면 업데이트, 없으면 생성)
    """
    dashboard_repo = DashboardRepository(session)
    dashboard = dashboard_repo.upsert(
        user_id=current_user.id, dashboard_config=dashboard_in.dashboard_config
    )
    return dashboard
