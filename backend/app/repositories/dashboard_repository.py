from datetime import datetime
from uuid import UUID

from sqlmodel import Session, select

from app.schemas.dashboard import Dashboard


class DashboardRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_user(self, user_id: UUID) -> Dashboard | None:
        """사용자별 대시보드 조회"""
        statement = select(Dashboard).where(Dashboard.user_id == user_id)
        return self.session.exec(statement).first()

    def upsert(self, user_id: UUID, dashboard_config: dict) -> Dashboard:
        """대시보드 upsert (있으면 업데이트, 없으면 생성)"""
        # 기존 대시보드 조회
        existing_dashboard = self.get_by_user(user_id)

        if existing_dashboard:
            # 기존 대시보드 업데이트
            existing_dashboard.dashboard_config = dashboard_config
            existing_dashboard.updated_at = datetime.utcnow()
            self.session.add(existing_dashboard)
            self.session.commit()
            self.session.refresh(existing_dashboard)
            return existing_dashboard
        else:
            # 새 대시보드 생성
            new_dashboard = Dashboard(
                user_id=user_id, dashboard_config=dashboard_config
            )
            self.session.add(new_dashboard)
            self.session.commit()
            self.session.refresh(new_dashboard)
            return new_dashboard
