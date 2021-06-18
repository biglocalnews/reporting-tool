from pydantic import BaseModel, UUID4, EmailStr
from fastapi_users import models
from fastapi_users.db.base import BaseUserDatabase
from fastapi_users.db.sqlalchemy import GUID
from typing import Optional, List
import database



class UserRole(BaseModel):
    name: str
    description: str

    class Config:
        orm_mode = True


class UserModel(models.BaseUser):
    first_name: str
    last_name: str
    roles: List[UserRole]


class UserCreateModel(models.BaseUserCreate):
    first_name: str
    last_name: str
    roles: Optional[List[str]]


class UserUpdateModel(UserModel, models.BaseUserUpdate):
    first_name: Optional[str]
    last_name: Optional[str]
    roles: Optional[List[str]]


class UserDBModel(UserModel, models.BaseUserDB):
    first_name: str
    last_name: str


class SQLAlchemyORMUserDatabase(BaseUserDatabase):
    """FastAPI-Users database integration for SQLAlchemy ORM.

    Based on SQLAlchemyUserDatabase:
    https://github.com/frankie567/fastapi-users/blob/c83bdeb0e0004692f398ad89a4fdeaaa125900d5/fastapi_users/db/sqlalchemy.py#L92
    """

    def __init__(self, session_factory):
        super().__init__(UserDBModel)
        self.session_factory = session_factory

    async def get(self, id: UUID4) -> UserDBModel:
        # TODO! Use an async session
        session = self.session_factory()
        dbuser = session.query(database.User).get(id)
        user = UserDBModel.from_orm(dbuser) if dbuser else None
        session.close()
        return user

    async def get_by_email(self, email: EmailStr) -> UserDBModel:
        # TODO! Use an async session
        session = self.session_factory()
        dbuser = database.User.get_by_email(session, email)
        user = UserDBModel.from_orm(dbuser) if dbuser else None
        session.close()
        return user

    async def create(self, user: UserCreateModel) -> UserDBModel:
        # TODO! Use an async session
        session = self.session_factory()
        d = user.dict()
        d['roles'] = [database.Role.get_by_name(r) for r in user.roles]
        dbuser = database.User(**d)
        session.add(dbuser)
        session.commit()
        user = UserDBModel.from_orm(dbuser)
        session.close()
        return user
    
    async def update(self, user: UserUpdateModel) -> UserDBModel:
        # TODO! Use an async session
        session = self.session_factory()
        d = user.dict()
        d['roles'] = [database.Role.get_by_name(r) for r in user.roles]
        dbuser = database.User(**d)
        session.merge(dbuser)
        session.commit()
        user = UserDBModel.from_orm(dbuser)
        session.close()
        return user

    async def delete(self, user: UserModel) -> None:
        session = self.session_factory()
        database.User.delete(session, user.id)
        session.commit()
        session.close()


user_db = SQLAlchemyORMUserDatabase(database.SessionLocal)
