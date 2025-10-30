from sqlmodel import SQLModel  # noqa

from .auth import NewPassword, Token, TokenPayload  # noqa
from .dashboard import (
    Dashboard,  # noqa
    DashboardBase,  # noqa
    DashboardCreate,  # noqa
    DashboardPublic,  # noqa
    DashboardPublicList,  # noqa
    DashboardUpdate,  # noqa
)
from .dynamic_type_config import (
    DynamicTypeConfig,  # noqa
    DynamicTypeConfigBase,  # noqa
    DynamicTypeConfigCreate,  # noqa
    DynamicTypeConfigPublic,  # noqa
    DynamicTypeConfigPublicList,  # noqa
    DynamicTypeConfigUpdate,  # noqa
)
from .item import Item, ItemBase, ItemCreate, ItemPublic, ItemsPublic, ItemUpdate  # noqa
from .robot import Robot, RobotBase, RobotCreate, RobotPublic, RobotsPublic, RobotUpdate  # noqa
from .user import (
    UpdatePassword,  # noqa
    User,  # noqa
    UserBase,  # noqa
    UserCreate,  # noqa
    UserPublic,  # noqa
    UserRegister,  # noqa
    UsersPublic,  # noqa
    UserUpdate,  # noqa
    UserUpdateMe,  # noqa
)
from .occupancy_map import (
    OccupancyMap,  # noqa
    OccupancyMapCreate,  # noqa
    OccupancyMapUpdate,  # noqa
    OccupancyMapPublic,  # noqa
    OccupancyMapsPublic,  # noqa
)

# 모든 모델을 여기서 import하여 SQLModel.metadata에 등록
