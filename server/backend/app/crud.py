import uuid
from typing import Any

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.schemas import Item, ItemCreate, User, UserCreate, UserUpdate


def get_user(session: Session, user_id: str) -> User | None:
    return session.get(User, user_id)


def get_user_by_email(session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()


def get_users(
    session: Session, *, skip: int = 0, limit: int = 100
) -> tuple[list[User], int]:
    statement = select(User).offset(skip).limit(limit)
    users = session.exec(statement).all()
    total = session.exec(select(User)).count()
    return users, total


def create_user(session: Session, *, user_create: UserCreate) -> User:
    db_obj = User(
        email=user_create.email,
        hashed_password=user_create.password,  # type: ignore
        full_name=user_create.full_name,
        is_superuser=user_create.is_superuser,
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(
    session: Session, *, db_obj: User, obj_in: UserUpdate
) -> User:
    update_data = obj_in.model_dump(exclude_unset=True)
    if "password" in update_data:
        hashed_password = update_data["password"]  # type: ignore
        del update_data["password"]
        update_data["hashed_password"] = hashed_password
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_items(
    session: Session, *, skip: int = 0, limit: int = 100
) -> tuple[list[Item], int]:
    statement = select(Item).offset(skip).limit(limit)
    items = session.exec(statement).all()
    total = session.exec(select(Item)).count()
    return items, total


def create_user_item(
    session: Session, *, item_create: ItemCreate, user_id: str
) -> Item:
    db_obj = Item(**item_create.model_dump(), owner_id=user_id)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user


def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item
