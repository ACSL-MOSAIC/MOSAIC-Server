from collections.abc import Sequence
from sqlmodel import Session, select, func

from app.core.security import get_password_hash, verify_password
from app.schemas.user import User, UserCreate, UserUpdate, UpdatePassword


class UserRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_user_by_email(self, email: str) -> User | None:
        statement = select(User).where(User.email == email)
        return self.session.exec(statement).first()

    def get_users(self, skip: int = 0, limit: int = 100) -> tuple[Sequence[User], int]:
        statement = select(User).offset(skip).limit(limit)
        users = self.session.exec(statement).all()
        total = self.session.exec(select(func.count()).select_from(User)).one()
        return users, total

    def create(self, user_create: UserCreate) -> User:
        db_obj = User(
            email=user_create.email,
            hashed_password=get_password_hash(user_create.password),
            full_name=user_create.full_name,
            is_superuser=user_create.is_superuser,
        )
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: User, obj_in: UserUpdate) -> User:
        update_data = obj_in.model_dump(exclude_unset=True)
        if "password" in update_data:
            hashed_password = update_data["password"]
            del update_data["password"]
            update_data["hashed_password"] = hashed_password

        db_obj.sqlmodel_update(update_data)
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update_password(self, db_obj: User, obj_in: UpdatePassword) -> User:
        update_data = obj_in.model_dump(exclude_unset=True)
        hashed_password = get_password_hash(obj_in.new_password)
        update_data["hashed_password"] = hashed_password

        db_obj.sqlmodel_update(update_data)
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def authenticate(self, email: str, password: str) -> User | None:
        db_user = self.get_user_by_email(email)
        if not db_user:
            return None
        if not verify_password(password, db_user.hashed_password):
            return None
        return db_user