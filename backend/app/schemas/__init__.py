from sqlmodel import SQLModel
from .auth import *
from .user import *
from .item import *
from .robot import *

# 모든 모델을 여기서 import하여 SQLModel.metadata에 등록 