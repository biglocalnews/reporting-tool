from typing import cast
import json
import logging
from uuid import uuid4
import datetime

from starlette.responses import RedirectResponse
import uvicorn
from fastapi import FastAPI, Request, Depends, HTTPException, Response, status
from fastapi_users.router.reset import RESET_PASSWORD_TOKEN_AUDIENCE
import dateutil.parser
from sqlalchemy.orm import Session
from ariadne import (
    load_schema_from_path,
    make_executable_schema,
    snake_case_fallback_resolvers,
    ScalarType,
)
from ariadne.asgi import GraphQL

from saml import get_saml_auth, dev_saml_idp
from connection import connection
from seed import is_blank_slate
from database import Organization, User, Role
from queries import queries
from mutations import mutation
from settings import settings
import mailer
import user
import directives
import monitoring



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


async def on_after_forgot_password(
    user: user.UserDBModel, token: str, request: Request
):
    """Handle forgot-password by sending them an email with a reset link."""
    await mailer.send_password_reset_email(user, token)


async def after_verification_request(
    user: user.UserDBModel, token: str, request: Request
):
    """Handle user verification request by emailing link."""
    await mailer.send_verify_request_email(user, token)


async def after_verify(user: user.UserDBModel, request: Request):
    """Handle verification by sending confirmation email."""
    await mailer.send_verify_confirm_email(user)


def admin_user(request: Request):
    """Dependency to verify that a user is an admin."""
    user = request.scope.get("dbuser")
    if not user:
        raise HTTPException(status_code=401, detail="You are not authenticated")
    if not any(r.name == "admin" for r in user.roles):
        raise HTTPException(
            status_code=403, detail="You do not have permission for this action"
        )
    return user


# Add restful routers for user management
app.include_router(
    user.fastapi_users.get_auth_router(user.cookie_authentication),
    prefix="/auth/cookie",
    tags=["auth"],
)
app.include_router(
    user.fastapi_users.get_register_router(on_after_register),
    prefix="/auth",
    dependencies=[Depends(admin_user)],
    tags=["auth"],
)
app.include_router(
    user.fastapi_users.get_reset_password_router(
        settings.app_secret, after_forgot_password=on_after_forgot_password
    ),
    prefix="/auth",
    tags=["auth"],
)

app.include_router(
    user.fastapi_users.get_verify_router(
        settings.app_secret,
        after_verification_request=after_verification_request,
        after_verification=after_verify,
    ),
    prefix="/auth",
    tags=["auth"],
)


@app.get("/reset-my-password")
def get_reset_password_token(dbuser=Depends(user.fastapi_users.get_current_user)):
    """Get a token to reset one's own password."""
    token = user.get_valid_token(
        RESET_PASSWORD_TOKEN_AUDIENCE,
        user_id=str(dbuser.id),
    )
    return {
        "token": token,
    }





seed_admins = [
    "cobair01",
    "joannl01",
    "webers02",
    "lismoc01",
    "brownc09",
    "khany88",
    "oconnk11",
    "wrighg24",
    "weberd01",
]


@app.get("/sso")
async def login(request: Request, auth = Depends(get_saml_auth)):
    redirect = auth.login()
    return RedirectResponse(redirect)


@app.post("/acs")
async def acs(request: Request, auth = Depends(get_saml_auth), status_code=200):
    try:
        auth.process_response()

        errors = auth.get_errors()

        if errors:
            raise HTTPException(
                status_code=500,
                detail="Error when processing SAML Response: %s %s"
                % (
                    ", ".join(errors),
                    auth.get_last_error_reason(),
                ),
            )

        if not auth.is_authenticated():
            raise HTTPException(status_code=401, detail="Not authenticated")

        username = auth.get_nameid().lower()
        from onelogin.saml2.xmlparser import tostring
        logging.info(f"{username} successfully authenticated")
        samlUserdata = auth.get_attributes()
        print('USER DATA', username, samlUserdata)
        print("EMAIL ADDRESS", samlUserdata['mail'])

        if (
            not "mail" in samlUserdata
        ):
            raise HTTPException(status_code=500, detail="Unexpected SAML response")

        email = samlUserdata["mail"][0]
        preferred_name = samlUserdata["givenName"][0]
        last_name = samlUserdata["surname"][0]

        dbsession = request.scope.get("dbsession")

        if not dbsession:
            raise HTTPException(status_code=500, detail="No dbsession found")

        bbc_db_user = User.get_by_username(session=dbsession, username=username)

        if not bbc_db_user:
            new_id = uuid4()
            bbc_db_user = User(
                id=new_id,
                username=username,
                email=email,
                hashed_password=uuid4(),
                first_name=preferred_name,
                last_name=last_name,
                last_changed_password=datetime.datetime.now(),
                last_login=datetime.datetime.now(),
            )
            if username in seed_admins:
                admin = dbsession.query(Role).get(
                    "be5f8cac-ac65-4f75-8052-8d1b5d40dffe"
                )
                bbc_db_user.roles.append(admin)
            dbsession.add(bbc_db_user)
            dbsession.commit()
        # redirect_url = (
        #    req["post_data"]["RelayState"] if "RelayState" in req["post_data"] else "/"
        # )
        response = RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)
        logging.info(str(bbc_db_user.id))
        response.set_cookie(
            key="rtauth",
            value=user.get_valid_token(
                "fastapi-users:auth", user_id=str(bbc_db_user.id)
            ),
        )
        dbsession.close()
        return response

    except Exception as e:
        logging.exception(e)
        if hasattr(e, "message"):
            raise HTTPException(status_code=500, detail=e.message)
        else:
            raise HTTPException(status_code=500, detail="Unknown error occurred")


@app.get("/health")
def get_health(request: Request):
    try:
        dbsession = cast(Session, request.scope.get("dbsession"))
        org = dbsession.query(Organization).first()
        monitoring.log_metric(1)
        return Response(
            org.name if org else "No default organisation found", status_code=200
        )
    except Exception as ex:
        logging.exception(ex)

        try:
            monitoring.log_metric(0)
            monitoring.log_event(str(ex))
        except Exception as ex:
            logging.exception(ex)

        raise HTTPException(status_code=500, detail=str(ex))


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
users_router = user.fastapi_users.get_users_router()
delete_route = [r for r in users_router.routes if r.name == "delete_user"][0]
delete_route.response_class = Response

# Separately, to implement "blank slate" mode, use a dependency that returns
# a 418 code when the app is not yet configured.
async def blank_slate(request: Request):
    if is_blank_slate(request.scope.get("dbsession")):
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
type_defs = load_schema_from_path("schema.graphql")
schema = make_executable_schema(
    type_defs,
    queries,
    mutation,
    datetime_scalar,
    snake_case_fallback_resolvers,
    directives={"needsPermission": directives.NeedsPermissionDirective},
)


@app.middleware("http")
async def add_user(request: Request, call_next):
    dbsession = request.scope["dbsession"]

    # allow for manual specification of user in request header by email
    if settings.debug and "X-User" in request.headers:
        dbuser = User.get_by_email(session=dbsession, email=request.headers["X-User"])
    else:
        # NOTE(jnu): fastapi_users.current_user is meant to be called with
        # FastAPI's `Depends`. We have to hook into their "blood magic" here
        # to call it outside of Depends.
        user_db = await user.fastapi_users.current_user(active=True, optional=True)(
            cookie=request.cookies.get("rtauth")
        )
        # The permissions checks use the ORM object, not the Pydantic model.
        dbuser = dbsession.query(User).get(user_db.id) if user_db else None

    request.scope["dbuser"] = dbuser
    return await call_next(request)


@app.middleware("http")
async def add_db_session(request: Request, call_next):
    session = app.extra["get_db_session"]()
    request.scope["dbsession"] = session

    response = await call_next(request)

    session.close()

    return response


async def get_context(request: Request):
    dbsession = request.scope["dbsession"]
    dbuser = request.scope["dbuser"]
    return {
        "dbsession": dbsession,
        "request": request,
        "current_user": dbuser,
    }


# Mount ariadne to fastapi
app.mount("/graphql", GraphQL(schema, debug=settings.debug, context_value=get_context))


if settings.debug:
    app.mount("/__dev__/saml", dev_saml_idp)


if __name__ == "__main__":
    uvicorn.run("app:app", reload=True)
