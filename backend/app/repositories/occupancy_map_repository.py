from datetime import datetime
from uuid import UUID

from sqlmodel import Session, select, func

from app.schemas import OccupancyMapsPublic, OccupancyMapCreate, OccupancyMapPublic, OccupancyMap, OccupancyMapUpdate


class OccupancyMapRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, occupancy_map_create: OccupancyMapCreate, owner_id: UUID) -> OccupancyMapPublic:
        db_occupancy_map = OccupancyMap(
            **occupancy_map_create.model_dump(),
            owner_id=owner_id,
        )
        self.session.add(db_occupancy_map)
        self.session.commit()
        self.session.refresh(db_occupancy_map)
        return OccupancyMapPublic(**db_occupancy_map.model_dump())

    def get_by_id(self, occupancy_map_id: UUID) -> OccupancyMap | None:
        return self.session.get(OccupancyMap, occupancy_map_id)

    def get_by_name(self, name: str, owner_id: UUID) -> OccupancyMap | None:
        statement = select(OccupancyMap).where(
            OccupancyMap.owner_id == owner_id,
            OccupancyMap.name == name
        )
        return self.session.exec(statement).first()

    def get_by_owner(self, owner_id: UUID, skip: int, limit: int) -> OccupancyMapsPublic:
        statement = (select(OccupancyMap)
                     .where(OccupancyMap.owner_id == owner_id)
                     .offset(skip)
                     .limit(limit))
        occupancy_maps = self.session.exec(statement).all()

        count_statement = (select(func.count())
                           .select_from(OccupancyMap)
                           .where(OccupancyMap.owner_id == owner_id))
        count = self.session.exec(count_statement).one()

        return OccupancyMapsPublic(data=occupancy_maps, count=count)

    def update(self, occupancy_map: OccupancyMap, occupancy_map_update: OccupancyMapUpdate) -> OccupancyMapPublic:
        update_data = occupancy_map_update.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.now()

        occupancy_map.sqlmodel_update(update_data)
        self.session.commit()
        self.session.refresh(occupancy_map)
        return OccupancyMapPublic(**occupancy_map.model_dump())

    def delete(self, occupancy_map_id: UUID) -> bool:
        db_occupancy_map = self.get_by_id(occupancy_map_id)
        if not db_occupancy_map:
            return False

        self.session.delete(db_occupancy_map)
        self.session.commit()
        return True
