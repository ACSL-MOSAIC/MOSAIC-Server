import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any

from sqlmodel import Field, SQLModel, JSON


# Shared properties
class DynamicTypeConfigBase(SQLModel):
    configuration: List[Dict[str, Any]] = Field(default_factory=list, sa_type=JSON)


# Properties to receive via API on creation/update
class DynamicTypeConfigCreate(DynamicTypeConfigBase):
    pass


class DynamicTypeConfigUpdate(DynamicTypeConfigBase):
    pass


# Database model, database table inferred from class name
class DynamicTypeConfig(DynamicTypeConfigBase, table=True):
    __tablename__ = "dynamic_type_config"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: uuid.UUID = Field(index=True, unique=True)  # 한 유저당 하나의 설정만 허용


# Properties to return via API
class DynamicTypeConfigPublic(DynamicTypeConfigBase):
    id: int
    user_id: uuid.UUID


class DynamicTypeConfigPublicList(SQLModel):
    data: list[DynamicTypeConfigPublic]
    count: int 