import uvicorn
import databases
import sqlalchemy
import datetime

from fastapi import FastAPI, Request
# from fastapi_sqlalchemy import DBSessionMiddleware  # middleware helper
# from fastapi_sqlalchemy import db  # an object to provide global access to a database session
from fastapi_users.authentication import JWTAuthentication
from fastapi_users import FastAPIUsers
from sqlalchemy.ext.declarative import DeclarativeMeta, declarative_base
import dateutil.parser

from ariadne import load_schema_from_path, make_executable_schema, snake_case_fallback_resolvers, ObjectType, ScalarType
from ariadne.asgi import GraphQL

from database import database, SessionLocal
from queries import query
from mutations import mutation
from settings import settings
import user


app = FastAPI()


jwt_authentication = JWTAuthentication(secret=settings.secret, lifetime_seconds=3600, tokenUrl="/auth/jwt/login")

fastapi_users = FastAPIUsers(
    user.user_db,
    [jwt_authentication],
    user.User,
    user.UserCreate,
    user.UserUpdate,
    user.UserDB,
)


# Add login functions 
def on_after_register(user: user.UserDB, request: Request):
    print(f"User {user.id} has registered.")


def on_after_forgot_password(user: user.UserDB, token: str, request: Request):
    print(f"User {user.id} has forgot their password. Reset token: {token}")


def after_verification_request(user: user.UserDB, token: str, request: Request):
    print(f"Verification requested for user {user.id}. Verification token: {token}")


# Add restful routers for user management
app.include_router(
    fastapi_users.get_auth_router(jwt_authentication), prefix="/auth/jwt", tags=["auth"]
)
app.include_router(
    fastapi_users.get_register_router(on_after_register), prefix="/auth", tags=["auth"]
)
app.include_router(
    fastapi_users.get_reset_password_router(
        settings.secret, after_forgot_password=on_after_forgot_password
    ),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_verify_router(
        settings.secret, after_verification_request=after_verification_request
    ),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(fastapi_users.get_users_router(), prefix="/users", tags=["users"])


# General Graphql Field Resolvers

datetime_scalar = ScalarType("DateTime")

@datetime_scalar.serializer
def serialize_datetime(value: datetime.datetime) -> str:
    return value.isoformat()

@datetime_scalar.value_parser
def parse_datetime(value: str) -> datetime.datetime:
    return dateutil.parser.parse(value)


# Adds graphql schema and mounts schema + resolvers to fastapi app
type_defs = load_schema_from_path("schema.graphql")
schema = make_executable_schema(
    type_defs, query, mutation, datetime_scalar, snake_case_fallback_resolvers
)

@app.middleware("http")
async def add_db_session(request: Request, call_next):
    session = SessionLocal()
    request.scope["dbsession"] = session

    response = await call_next(request)

    session.close()

    return response

def get_context(request: Request):
    return {
            "dbsession": request.scope['dbsession'],
            "request": request,
            }

# Mount ariadne to fastapi
app.mount("/graphql", GraphQL(schema, debug=True, context_value=get_context))

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
