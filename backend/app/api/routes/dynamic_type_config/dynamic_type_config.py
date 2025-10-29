from typing import Any

from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, SessionDep
from app.api.dto import Message
from app.repositories.dynamic_type_config_repository import DynamicTypeConfigRepository
from app.schemas.dynamic_type_config import (
    DynamicTypeConfigCreate,
    DynamicTypeConfigPublic,
)

router = APIRouter(prefix="/dynamic-type-config", tags=["dynamic-type-config"])


@router.get("/", response_model=DynamicTypeConfigPublic)
def read_dynamic_type_config(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    현재 사용자의 동적 타입 설정 조회
    """
    config_repo = DynamicTypeConfigRepository(session)
    config = config_repo.get_by_user(current_user.id)

    if not config:
        # 설정이 없으면 빈 배열로 초기화된 설정 반환
        return DynamicTypeConfigPublic(id=0, user_id=current_user.id, configuration=[])

    return config


@router.post("/", response_model=DynamicTypeConfigPublic)
def upsert_dynamic_type_config(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    config_in: DynamicTypeConfigCreate,
) -> Any:
    """
    동적 타입 설정 upsert (있으면 업데이트, 없으면 생성)
    """
    config_repo = DynamicTypeConfigRepository(session)
    config = config_repo.upsert(
        user_id=current_user.id, configuration=config_in.configuration
    )
    return config


@router.delete("/", response_model=Message)
def delete_dynamic_type_config(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    현재 사용자의 동적 타입 설정 삭제
    """
    config_repo = DynamicTypeConfigRepository(session)
    deleted = config_repo.delete_by_user(current_user.id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Dynamic type config not found")

    return Message(message="Dynamic type config deleted successfully")
