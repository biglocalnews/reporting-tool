from fastapi_users import models
from fastapi_users.db import (SQLAlchemyUserDatabase)
from typing import Optional
import database


class User(models.BaseUser):
    first_name: str
    last_name: str


class UserCreate(models.BaseUserCreate):
    first_name: str
    last_name: str


class UserUpdate(User, models.BaseUserUpdate):
    first_name: Optional[str]
    last_name: Optional[str]


class UserDB(User, models.BaseUserDB):
    first_name: str
    last_name: str


user_db = SQLAlchemyUserDatabase(
    UserDB, database.database, database.User.__table__)
