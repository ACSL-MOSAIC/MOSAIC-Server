import uuid
from datetime import datetime
from typing import Optional, List

from sqlmodel import Field, Relationship, SQLModel


class OccupancyMap(SQLModel, table=True):
    __tablename__ = "occupancy_map"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    owner: Optional["User"] = Relationship(back_populates="occupancyMaps")
    name: str = Field(nullable=False, min_length=1, max_length=255)
    pgm_file_path: str = Field(min_length=1, max_length=1024)
    yaml_file_path: str = Field(min_length=1, max_length=1024)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class OccupancyMapCreate(SQLModel):
    name: str
    pgm_file_path: str
    yaml_file_path: str


class OccupancyMapUpdate(OccupancyMapCreate):
    pass


class OccupancyMapPublic(SQLModel):
    id: uuid.UUID
    name: str
    pgm_file_path: str
    yaml_file_path: str
    created_at: datetime
    updated_at: datetime

class OccupancyMapsPublic(SQLModel):
    data: List[OccupancyMapPublic]
    count: int
