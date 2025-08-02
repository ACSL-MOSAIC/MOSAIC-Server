import uuid
from enum import Enum
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel


class RobotStatus(str, Enum):
    READY_TO_CONNECT = "READY_TO_CONNECT"
    CONNECTING = "CONNECTING"
    CONNECTED = "CONNECTED"
    DISCONNECTED = "DISCONNECTED"
    REMOVED = "REMOVED"


# Shared properties
class RobotBase(SQLModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    status: RobotStatus = Field(default=RobotStatus.DISCONNECTED)


# Properties to receive on robot creation
class RobotCreate(RobotBase):
    id: uuid.UUID | None = Field(default_factory=uuid.uuid4)


# Properties to receive on robot update
class RobotUpdate(SQLModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    status: RobotStatus | None = None


# Database model, database table inferred from class name
class Robot(RobotBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: Optional["User"] = Relationship(back_populates="robots")


# Properties to return via API, id is always required
class RobotPublic(RobotBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class RobotsPublic(SQLModel):
    data: list[RobotPublic]
    count: int
