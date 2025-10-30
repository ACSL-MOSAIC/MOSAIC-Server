import uuid
from datetime import datetime
from typing import Any

from sqlmodel import JSON, Field, SQLModel


# Shared properties
class DashboardBase(SQLModel):
    dashboard_config: dict[str, Any] = Field(default_factory=dict, sa_type=JSON)


# Properties to receive via API on creation/update
class DashboardCreate(DashboardBase):
    pass


class DashboardUpdate(DashboardBase):
    pass


# Database model, database table inferred from class name
class Dashboard(DashboardBase, table=True):
    dashboard_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(index=True)  # FK 없이 단순 인덱스
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


# Properties to return via API
class DashboardPublic(DashboardBase):
    dashboard_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class DashboardPublicList(SQLModel):
    data: list[DashboardPublic]
    count: int
