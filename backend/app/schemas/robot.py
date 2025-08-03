import uuid
from enum import Enum
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel


class RobotStatus(str, Enum):
    INITIALIZING = "INITIALIZING" # Robot is being initialized (power on)
    READY_TO_CONNECT = "READY_TO_CONNECT" # Robot is ready to connect (waiting for peer)
    CONNECTING = "CONNECTING" # Robot is connecting to peer (handling sdp offer and ice candidates)
    CONNECTED = "CONNECTED" # Robot is connected to peer (peer connection established)
    DISCONNECTING = "DISCONNECTING" # Robot is disconnecting from peer (handling disconnection)
    FAILED = "FAILED" # Robot failed to connect (error during connection)
    SHUTTING_DOWN = "SHUTTING_DOWN" # Robot is shutting down (power off)
    DISCONNECTED = "DISCONNECTED" # Robot is disconnected (websocket connection closed)
    REMOVED = "REMOVED"


# Shared properties
class RobotBase(SQLModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    status: RobotStatus = Field(default=RobotStatus.DISCONNECTED)


# Properties to receive on robot creation
class RobotCreate(RobotBase):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)


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
