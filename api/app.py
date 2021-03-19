import uvicorn
import databases
import sqlalchemy

from fastapi import FastAPI
# from fastapi_sqlalchemy import DBSessionMiddleware  # middleware helper
# from fastapi_sqlalchemy import db  # an object to provide global access to a database session
from fastapi_users import models
from fastapi_users.db import SQLAlchemyBaseUserTable, SQLAlchemyUserDatabase
from sqlalchemy.ext.declarative import DeclarativeMeta, declarative_base

from ariadne import load_schema_from_path, make_executable_schema, snake_case_fallback_resolvers, ObjectType
from ariadne.asgi import GraphQL

from queries import query
from mutations import mutation

class User(models.BaseUser):
    pass


class UserCreate(models.BaseUserCreate):
    pass


class UserUpdate(User, models.BaseUserUpdate):
    pass


class UserDB(User, models.BaseUserDB):
    pass


DATABASE_URL = "postgres:pass@localhost/bbc"

database = databases.Database(DATABASE_URL)

Base: DeclarativeMeta = declarative_base()


class UserTable(Base, SQLAlchemyBaseUserTable):
    pass

engine = sqlalchemy.create_engine('postgresql+psycopg2://postgres:pass@localhost/bbc')

Base.metadata.create_all(engine)


users = UserTable.__table__
user_db = SQLAlchemyUserDatabase(UserDB, database, users)


app = FastAPI()

# auth_backends = [
#     JWTAuthentication(secret=SECRET, lifetime_seconds=3600),
# ]

# fastapi_users = FastAPIUsers(
#     user_db, auth_backends, User, UserCreate, UserUpdate, UserDB, SECRET,
# )
# app.include   _router(fastapi_users.router, prefix="/users", tags=["users"])


type_defs = load_schema_from_path("schema.graphql")
schema = make_executable_schema(
    type_defs, query, mutation, snake_case_fallback_resolvers
)

app.mount("/graphql", GraphQL(schema, debug=True))

@app.get("/")

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

def home():
    return "Ahh!! Aliens!"

if __name__ == "__main__":
    uvicorn.run("app:app")
