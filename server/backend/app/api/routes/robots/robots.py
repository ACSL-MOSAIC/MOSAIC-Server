import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.repositories import RobotRepository
from app.schemas import Robot, RobotCreate, RobotPublic, RobotsPublic, RobotUpdate, Message

router = APIRouter( tags=["robots"])


@router.get("/", response_model=RobotsPublic)
def read_robots(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve robots.
    """
    robot_repo = RobotRepository(session)

    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(Robot)
        count = session.exec(count_statement).one()
        statement = select(Robot).offset(skip).limit(limit)
        robots = session.exec(statement).all()
    else:
        robots = robot_repo.get_by_owner(current_user.id)
        count = len(robots)

    return RobotsPublic(data=robots, count=count)


@router.get("/{id}", response_model=RobotPublic)
def read_robot(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get robot by ID.
    """
    robot_repo = RobotRepository(session)
    robot = robot_repo.get(id)
    
    if not robot:
        raise HTTPException(status_code=404, detail="Robot not found")
    if not current_user.is_superuser and (robot.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return robot


@router.post("/", response_model=RobotPublic)
def create_robot(
    *, session: SessionDep, current_user: CurrentUser, robot_in: RobotCreate
) -> Any:
    """
    Create new robot.
    """
    robot_repo = RobotRepository(session)
    robot = robot_repo.create(robot_in, current_user.id)
    return robot


@router.put("/{id}", response_model=RobotPublic)
def update_robot(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    robot_in: RobotUpdate,
) -> Any:
    """
    Update a robot.
    """
    robot_repo = RobotRepository(session)
    robot = robot_repo.get(id)
    
    if not robot:
        raise HTTPException(status_code=404, detail="Robot not found")
    if not current_user.is_superuser and (robot.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    updated_robot = robot_repo.update(id, robot_in)
    if not updated_robot:
        raise HTTPException(status_code=404, detail="Robot not found")
    return updated_robot


@router.delete("/{id}")
def delete_robot(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a robot.
    """
    robot_repo = RobotRepository(session)
    robot = robot_repo.get(id)
    
    if not robot:
        raise HTTPException(status_code=404, detail="Robot not found")
    if not current_user.is_superuser and (robot.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    if not robot_repo.delete(id):
        raise HTTPException(status_code=404, detail="Robot not found")
    return Message(message="Robot deleted successfully") 