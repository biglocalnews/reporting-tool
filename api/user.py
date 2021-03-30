from fastapi_users import models
from fastapi_users.db import SQLAlchemyUserDatabase

import database


class User(models.BaseUser):
    pass


class UserCreate(models.BaseUserCreate):
    pass


class UserUpdate(User, models.BaseUserUpdate):
    pass


class UserDB(User, models.BaseUserDB):
    pass



user_db = SQLAlchemyUserDatabase(UserDB, database.database, database.User.__table__)
