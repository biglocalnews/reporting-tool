import uvicorn
import databases
import sqlalchemy

from fastapi import FastAPI, Request
# from fastapi_sqlalchemy import DBSessionMiddleware  # middleware helper
# from fastapi_sqlalchemy import db  # an object to provide global access to a database session
from fastapi_users.authentication import JWTAuthentication
from fastapi_users import FastAPIUsers
from sqlalchemy.ext.declarative import DeclarativeMeta, declarative_base

from ariadne import load_schema_from_path, make_executable_schema, snake_case_fallback_resolvers, ObjectType
from ariadne.asgi import GraphQL

from database import database
from queries import query
from mutations import mutation
import user


app = FastAPI()


#TODO, set secret as env var
SECRET = "SECRET"
jwt_authentication = JWTAuthentication(secret=SECRET, lifetime_seconds=3600, tokenUrl="/auth/jwt/login")


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
        SECRET, after_forgot_password=on_after_forgot_password
    ),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_verify_router(
        SECRET, after_verification_request=after_verification_request
    ),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(fastapi_users.get_users_router(), prefix="/users", tags=["users"])


# Adds graphql schema and mounts schema + resolvers to fastapi app
type_defs = load_schema_from_path("schema.graphql")
schema = make_executable_schema(
    type_defs, query, mutation, snake_case_fallback_resolvers
)
# Mount ariadne to fastapi
app.mount("/graphql", GraphQL(schema, debug=True))

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
