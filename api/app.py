import uvicorn
import databases
import sqlalchemy
import datetime

from fastapi import FastAPI, Request, Depends, HTTPException, Response
from fastapi_users.authentication import CookieAuthentication
from fastapi_users import FastAPIUsers
from fastapi_users.utils import generate_jwt
from sqlalchemy.ext.declarative import DeclarativeMeta, declarative_base
import dateutil.parser

from ariadne import load_schema_from_path, make_executable_schema, snake_case_fallback_resolvers, ObjectType, ScalarType
from ariadne.asgi import GraphQL

from database import database, SessionLocal, User
from queries import queries
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
        db=database,
        get_db_session=SessionLocal,
        )

# remove cookie_secure=False later for production
cookie_authentication = CookieAuthentication(
        secret=settings.secret,
        lifetime_seconds=3600,
        cookie_secure=False,
        cookie_name='rtauth')


fastapi_users = FastAPIUsers(
    user.user_db,
    [cookie_authentication],
    user.UserModel,
    user.UserCreateModel,
    user.UserUpdateModel,
    user.UserDBModel,
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
    fastapi_users.get_auth_router(cookie_authentication), prefix="/auth/cookie", tags=["auth"]
)
app.include_router(
    fastapi_users.get_register_router(on_after_register),
    prefix="/auth",
    dependencies=[Depends(admin_user)],
    tags=["auth"],
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
        settings.secret,
        after_verification_request=after_verification_request,
        after_verification=after_verify,
    ),
    prefix="/auth",
    tags=["auth"],
)

@app.get("/reset-my-password")
def get_reset_password_token(user = Depends(fastapi_users.get_current_user)):
    """Get a token to reset one's own password."""
    token_data = {"user_id": str(user.id), "aud": "fastapi-users:reset"}
    token = generate_jwt(data=token_data, secret=settings.secret, lifetime_seconds=120)
    return {
        "token": token,
    }


# HACK(jnu): There's a bug in FastAPI where the /users/delete route returns a
# None value for a 204 response. FastAPI chooses the JSONResponse class if no
# other one is specified, which causes the None value to be encoded as "null".
# This is an illegal response for a 204 "No data" status code, so it causes
# various different errors in servers and browsers.
#
# I submitted a pull request to fix this in fastapi-users here:
# https://github.com/frankie567/fastapi-users/pull/650
# 
# More info here:
# https://github.com/tiangolo/fastapi/issues/717
#
# When the PR is merged, bump the fastapi-users version and remove the hack.
# For now, reach into the router's delete_user route and set the response class
# explicitly to the bare Response class to avoid issues.
users_router = fastapi_users.get_users_router()
delete_route = [r for r in users_router.routes if r.name == 'delete_user'][0]
delete_route.response_class = Response
app.include_router(
    users_router,
    prefix="/users",
    tags=["users"],
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
type_defs = load_schema_from_path("schema.graphql")
schema = make_executable_schema(
    type_defs, 
    queries, 
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
        user = User.get_by_email(session=dbsession, email=request.headers['X-User'])
    else:
        # NOTE(jnu): fastapi_users.current_user is meant to be called with
        # FastAPI's `Depends`. We have to hook into their "blood magic" here
        # to call it outside of Depends.
        user_db = await fastapi_users.current_user(active=True, optional=True)(cookie=request.cookies.get('rtauth'))
        # The permissions checks use the ORM object, not the Pydantic model. 
        user = dbsession.query(User).get(user_db.id) if user_db else None

    request.scope["dbuser"] = user
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

@app.on_event("startup")
async def startup():
    await app.extra['db'].connect()
    pass

@app.on_event("shutdown")
async def shutdown():
    await app.extra['db'].disconnect()
    pass

def home():
    return "Ahh!! Aliens!"

if __name__ == "__main__":
    uvicorn.run("app:app")
