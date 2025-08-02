from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

from sqlmodel import Session, select

from app.schemas import DynamicTypeConfig, DynamicTypeConfigCreate


class DynamicTypeConfigRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_user(self, user_id: UUID) -> Optional[DynamicTypeConfig]:
        """사용자별 동적 타입 설정 조회"""
        statement = select(DynamicTypeConfig).where(DynamicTypeConfig.user_id == user_id)
        return self.session.exec(statement).first()

    def upsert(self, user_id: UUID, configuration: List[Dict[str, Any]]) -> DynamicTypeConfig:
        """동적 타입 설정 upsert (있으면 업데이트, 없으면 생성)"""
        # 기존 설정 조회
        existing_config = self.get_by_user(user_id)
        
        if existing_config:
            # 기존 설정 업데이트
            existing_config.configuration = configuration
            self.session.add(existing_config)
            self.session.commit()
            self.session.refresh(existing_config)
            return existing_config
        else:
            # 새 설정 생성
            new_config = DynamicTypeConfig(
                user_id=user_id,
                configuration=configuration
            )
            self.session.add(new_config)
            self.session.commit()
            self.session.refresh(new_config)
            return new_config

    def delete_by_user(self, user_id: UUID) -> bool:
        """사용자의 동적 타입 설정 삭제"""
        existing_config = self.get_by_user(user_id)
        if not existing_config:
            return False

        self.session.delete(existing_config)
        self.session.commit()
        return True 