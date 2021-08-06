from pydantic import BaseModel, UUID4, EmailStr
from datetime import datetime
from fastapi_users.authentication import CookieAuthentication
from fastapi_users import FastAPIUsers
from fastapi_users import models
from fastapi_users.utils import generate_jwt
from fastapi_users.db.base import BaseUserDatabase
from fastapi_users.db.sqlalchemy import GUID
from sqlalchemy.sql import func
from typing import Optional, List, Dict
from settings import settings
import database


class BaseUserCreateUpdate(BaseModel):
    id: Optional[UUID4]

    def create_update_dict(self):
        return self.dict(
            exclude_unset=True,
            exclude={
                "id",
                "is_superuser",
                "is_active",
                "is_verified",
                "last_login",
                "last_changed_password",
                "oauth_accounts",
                "roles",
                "teams",
            },
        )

    def create_update_dict_superuser(self):
        return self.dict(exclude_unset=True, exclude={"id"})


class UserRole(BaseModel):
    id: UUID4
    name: Optional[str]
    description: Optional[str]

    class Config:
        orm_mode = True


class UserTeam(BaseModel):
    id: UUID4
    name: Optional[str]

    class Config:
        orm_mode = True


class UserModel(models.BaseUser):
    first_name: str
    last_name: str
    roles: Optional[List[UserRole]]
    teams: Optional[List[UserTeam]]
    last_login: Optional[datetime]
    last_changed_password: Optional[datetime]


class UserCreateModel(BaseUserCreateUpdate):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    roles: Optional[List[UserRole]]
    teams: Optional[List[UserTeam]]


class UserUpdateModel(BaseUserCreateUpdate):
    email: Optional[EmailStr]
    password: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    roles: Optional[List[UserRole]]
    teams: Optional[List[UserTeam]]
    is_active: Optional[bool]
    is_verified: Optional[bool]


class UserDBModel(UserModel, models.BaseUserDB):
    first_name: str
    last_name: str


class SQLAlchemyORMUserDatabase(BaseUserDatabase):
    """FastAPI-Users database integration for SQLAlchemy ORM.

    Based on SQLAlchemyUserDatabase:
    https://github.com/frankie567/fastapi-users/blob/c83bdeb0e0004692f398ad89a4fdeaaa125900d5/fastapi_users/db/sqlalchemy.py#L92
    """

    @classmethod
    def format_orm_model(cls, ormuser: Optional[database.User]) -> UserDBModel:
        if not ormuser:
            return None
        user = UserDBModel.from_orm(ormuser)
        if any(r.name == "admin" for r in user.roles):
            user.is_superuser = True
        user.is_active = ormuser.deleted is None
        return user

    def __init__(self, session_factory):
        super().__init__(UserDBModel)
        self.session_factory = session_factory

    async def get(self, id: UUID4) -> UserDBModel:
        # TODO! Use an async session
        session = self.session_factory()
        dbuser = session.query(database.User).get(id)
        user = self.format_orm_model(dbuser)
        session.close()
        return user

    async def get_by_email(self, email: EmailStr) -> UserDBModel:
        # TODO! Use an async session
        session = self.session_factory()
        dbuser = database.User.get_by_email(session, email)
        user = self.format_orm_model(dbuser)
        session.close()
        return user

    async def create(self, user: UserCreateModel) -> UserDBModel:
        # TODO! Use an async session
        session = self.session_factory()
        d = user.dict()
        roles = d.pop("roles", [])
        teams = d.pop("teams", [])
        dbuser = database.User(**d)
        if roles:
            dbuser.roles = (
                session.query(database.Role)
                .filter(database.Role.id.in_([r["id"] for r in roles]))
                .all()
            )
        if teams:
            dbuser.teams = (
                session.query(database.Team)
                .filter(database.Team.id.in_([t["id"] for t in teams]))
                .all()
            )
        session.add(dbuser)
        session.commit()
        user = self.format_orm_model(dbuser)
        session.close()
        return user

    async def update(self, user: UserUpdateModel) -> UserDBModel:
        # TODO! Use an async session
        session = self.session_factory()
        d = user.dict()

        # Get the existing user from the DB
        dbuser = session.query(database.User).get(user.id)

        # Only allow updates of certain columns
        for k in [
            "first_name",
            "last_name",
            "email",
            "is_active",
            "is_verified",
            "hashed_password",
        ]:
            if k in d:
                if k == "hashed_password" and dbuser.hashed_password != d[k]:
                    dbuser.last_changed_password = func.now()
                setattr(dbuser, k, d[k])

                # Special handling for deletes, since we use the `deleted`
                # column while the fastapi-users library uses is_active. We
                # let queries set `is_active` if they want to delete or restore
                # and we will set `deleted` automatically.
                if k == "is_active":
                    if d[k]:
                        dbuser.deleted = None
                    else:
                        dbuser.deleted = func.now()

        # Update roles and teams separately
        dbuser.roles = (
            session.query(database.Role)
            .filter(
                database.Role.id.in_([r["id"] for r in d["roles"]]),
                database.Role.deleted == None,
            )
            .all()
            if d["roles"]
            else []
        )

        dbuser.teams = (
            session.query(database.Team)
            .filter(
                database.Team.id.in_([t["id"] for t in d["teams"]]),
                database.Team.deleted == None,
            )
            .all()
            if d["teams"]
            else []
        )

        session.merge(dbuser)
        session.commit()
        user = self.format_orm_model(dbuser)
        session.close()
        return user

    async def delete(self, user: UserModel) -> None:
        session = self.session_factory()
        database.User.delete(session, user.id)
        session.commit()
        session.close()
        return None

    async def authenticate(self, credentials) -> Optional[UserDBModel]:
        user = await super().authenticate(credentials)
        # Mark this as the most recent login.
        # The user object we return will have the last login, not this one.
        session = self.session_factory()
        session.query(database.User).filter(database.User.id == user.id).update(
            {
                "last_login": func.now(),
            },
            synchronize_session=False,
        )
        session.commit()
        session.close()

        return user


user_db = SQLAlchemyORMUserDatabase(database.connection)


# remove cookie_secure=False later for production
cookie_authentication = CookieAuthentication(
    secret=settings.secret,
    lifetime_seconds=3600,
    cookie_secure=settings.use_secure_cookies,
    cookie_name="rtauth",
)


fastapi_users = FastAPIUsers(
    user_db,
    [cookie_authentication],
    UserModel,
    UserCreateModel,
    UserUpdateModel,
    UserDBModel,
)


def get_valid_token(type_: str, **kwargs) -> str:
    """Get a valid JWT for fastapi-users.

    :param type_: Token audience (see fastapi-users for constants)
    :param **kwargs: Data to encode in the token
    :returns: Encoded JWT
    """
    token_data = {"aud": type_}
    token_data.update(kwargs)
    return generate_jwt(
        data=token_data,
        secret=cookie_authentication.secret,
        lifetime_seconds=cookie_authentication.lifetime_seconds,
    )
