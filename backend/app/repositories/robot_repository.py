from collections.abc import Sequence
from uuid import UUID

from sqlmodel import Session, select

from app.schemas.robot import Robot, RobotCreate, RobotUpdate


class RobotRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, robot_create: RobotCreate, owner_id: UUID) -> Robot:
        db_robot = Robot(
            id=robot_create.id,
            **robot_create.model_dump(exclude={"id"}),
            owner_id=owner_id,
        )
        self.session.add(db_robot)
        self.session.commit()
        self.session.refresh(db_robot)
        return db_robot

    def get(self, robot_id: UUID) -> Robot | None:
        return self.session.get(Robot, robot_id)

    def get_by_owner(self, owner_id: UUID) -> Sequence[Robot]:
        statement = select(Robot).where(Robot.owner_id == owner_id)
        return self.session.exec(statement).all()

    def update(self, robot_id: UUID, robot_update: RobotUpdate) -> Robot | None:
        db_robot = self.get(robot_id)
        if not db_robot:
            return None

        update_data = robot_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_robot, field, value)

        self.session.add(db_robot)
        self.session.commit()
        self.session.refresh(db_robot)
        return db_robot

    def delete(self, robot_id: UUID) -> bool:
        db_robot = self.get(robot_id)
        if not db_robot:
            return False

        self.session.delete(db_robot)
        self.session.commit()
        return True
