import uvicorn
import databases
import sqlalchemy
import datetime

from fastapi import FastAPI, Request, Depends, HTTPException, Response
from fastapi_users.router.reset import RESET_PASSWORD_TOKEN_AUDIENCE
from sqlalchemy.ext.declarative import DeclarativeMeta, declarative_base
import dateutil.parser

from ariadne import load_schema_from_path, make_executable_schema, snake_case_fallback_resolvers, ObjectType, ScalarType
from ariadne.asgi import GraphQL

from database import connection, User, is_blank_slate
from queries import queries
from reporting_queries import reporting_queries
from mutations import mutation
from settings import settings
import mailer
import user
import directives


app = FastAPI(
        debug=settings.debug,
        # NOTE: the following dependencies are available in the `extra` dict
        # on the app object. They're injected here so they can be patched
        # easier in testing.
        get_db_session=connection,
        )


async def on_after_register(user: user.UserDBModel, request: Request):
    """Handle user registration by sending the new user a greeting."""
    json = await request.json()
    temp_password = json["password"]
    await mailer.send_register_email(user, temp_password)


async def on_after_forgot_password(user: user.UserDBModel, token: str, request: Request):
    """Handle forgot-password by sending them an email with a reset link."""
    await mailer.send_password_reset_email(user, token)


async def after_verification_request(user: user.UserDBModel, token: str, request: Request):
    """Handle user verification request by emailing link."""
    await mailer.send_verify_request_email(user, token)


async def after_verify(user: user.UserDBModel, request: Request):
    """Handle verification by sending confirmation email."""
    await mailer.send_verify_confirm_email(user)


def admin_user(request: Request):
    """Dependency to verify that a user is an admin."""
    user = request.scope.get('dbuser')
    if not user:
        raise HTTPException(status_code=401, detail="You are not authenticated")
    if not any(r.name == 'admin' for r in user.roles):
        raise HTTPException(status_code=403, detail="You do not have permission for this action")
    return user
    


# Add restful routers for user management
app.include_router(
    user.fastapi_users.get_auth_router(user.cookie_authentication), prefix="/auth/cookie", tags=["auth"]
)
app.include_router(
    user.fastapi_users.get_register_router(on_after_register),
    prefix="/auth",
    dependencies=[Depends(admin_user)],
    tags=["auth"],
)
app.include_router(
    user.fastapi_users.get_reset_password_router(
        settings.secret, after_forgot_password=on_after_forgot_password
    ),
    prefix="/auth",
    tags=["auth"],
)

app.include_router(
    user.fastapi_users.get_verify_router(
        settings.secret,
        after_verification_request=after_verification_request,
        after_verification=after_verify,
    ),
    prefix="/auth",
    tags=["auth"],
)


@app.get("/reset-my-password")
def get_reset_password_token(dbuser = Depends(user.fastapi_users.current_user())):
    """Get a token to reset one's own password."""
    token = user.get_valid_token(
        RESET_PASSWORD_TOKEN_AUDIENCE,
        user_id=str(dbuser.id),
        )
    return {
        "token": token,
        }

users_router = user.fastapi_users.get_users_router()

# Separately, to implement "blank slate" mode, use a dependency that returns
# a 418 code when the app is not yet configured.
async def blank_slate(request: Request):
    if is_blank_slate(request.scope.get('dbsession')):
        raise HTTPException(status_code=418, detail="App is not yet configured")

app.include_router(
    users_router,
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(blank_slate)],
)



# General Graphql Field Resolvers

datetime_scalar = ScalarType("DateTime")

@datetime_scalar.serializer
def serialize_datetime(value: datetime.datetime) -> str:
    return value.isoformat()

@datetime_scalar.value_parser
def parse_datetime(value: str) -> datetime.datetime:
    return dateutil.parser.parse(value)


# Adds graphql schema and mounts schema + resolvers to fastapi app
type_defs = load_schema_from_path("./graphql")
schema = make_executable_schema(
    type_defs, 
    queries, 
    reporting_queries,
    mutation, 
    datetime_scalar, 
    snake_case_fallback_resolvers,
    directives={"needsPermission": directives.NeedsPermissionDirective}
)


@app.middleware("http")
async def add_user(request: Request, call_next):
    dbsession = request.scope["dbsession"]

    # allow for manual specification of user in request header by email
    if settings.debug and "X-User" in request.headers:
        dbuser = User.get_by_email(session=dbsession, email=request.headers['X-User'])
    else:
        # NOTE(jnu): fastapi_users.current_user is meant to be called with
        # FastAPI's `Depends`. We have to hook into their "blood magic" here
        # to call it outside of Depends.
        user_db = await user.fastapi_users.current_user(active=True, optional=True)(cookie=request.cookies.get('rtauth'))
        # The permissions checks use the ORM object, not the Pydantic model. 
        dbuser = dbsession.query(User).get(user_db.id) if user_db else None

    request.scope["dbuser"] = dbuser
    return await call_next(request)


@app.middleware("http")
async def add_db_session(request: Request, call_next):
    session = app.extra['get_db_session']()
    request.scope["dbsession"] = session

    response = await call_next(request)

    session.close()

    return response


async def get_context(request: Request):
    dbsession = request.scope['dbsession']
    dbuser = request.scope['dbuser']
    return {
            "dbsession": dbsession,
            "request": request,
            "current_user": dbuser,
            }

# Mount ariadne to fastapi
app.mount("/graphql", GraphQL(schema, debug=settings.debug, context_value=get_context))


def home():
    return "Ahh!! Aliens!"


if __name__ == "__main__":
    uvicorn.run("app:app")
