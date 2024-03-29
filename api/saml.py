from typing import Optional
import zlib
from base64 import b64decode, b64encode
from datetime import datetime, timedelta

from fastapi import Request, FastAPI, HTTPException
from starlette.responses import RedirectResponse, HTMLResponse
from starlette import status
from onelogin.saml2.auth import OneLogin_Saml2_Auth
from onelogin.saml2.settings import OneLogin_Saml2_Settings
from onelogin.saml2.utils import OneLogin_Saml2_Utils
from lxml import etree
from pydantic import BaseModel

from settings import settings
from templates import templates
from database import User



class SamlUserdata(BaseModel):
    """Object representing user data from SAML assertion."""
    username: str
    first_name: str
    last_name: str
    roles: list[str]
    email: str



async def _build_saml_req(host: str, request: Request):
    """Interpret HTTP request to OneLogin auth request params.

    Args:
        host - Public hostname of service
        request - The FastAPI request object.

    Returns:
        Dict containing OneLogin request parameters.
    """
    post_data = await request.form()
    return {
        "http_host": request.headers.get('host'),
        "script_name": f"/api{request.url.path}",
        "get_data": request.query_params,
        "post_data": post_data,
        "https": "on" if request.url.scheme == 'https' else "off",
    }


def _init_saml_auth(req: dict, saml_settings):
    """Instantiate the Saml2 Auth object.

    Params:
        req - OneLogin's request dictionary
        saml_settings - SAML2 service provider configuration

    Returns:
        `OneLogin_Saml2_Auth`
    """
    return OneLogin_Saml2_Auth(req, OneLogin_Saml2_Settings(saml_settings))


async def get_saml_auth(request: Request):
    """Return the SAML2 auth object.

    This can be used as a dependency in FastAPI.

    Yields:
        `OneLogin_Saml2_Auth` with configuration from `settings`
    """
    saml_req = await _build_saml_req(settings.host, request)
    auth = _init_saml_auth(saml_req, settings.saml)
    yield auth


def get_saml_userdata(auth: OneLogin_Saml2_Auth):
    """Get standardized SAML userdata from the auth object.

    Aliases for the standard fields can be defined in the rt_saml_userdata
    secret. See `settings` for more details.

    Args:
        auth - Auth object that has been parsed

    Returns:
        SamlUserdata
    """
    # Hardcode username, which we fetch from the name ID instead of the
    # attribute fields of the assertion.
    values = {'username': auth.get_nameid()}

    # Accept either raw names or "friendly" names -- different SAML configs
    # will use these differently.
    raw_userdata = auth.get_attributes().copy()
    raw_userdata.update(auth.get_friendlyname_attributes())
    aliases = settings.saml_userdata

    # Run through all our standard fields and look them up in the raw data.
    # Use the alias for the field from the settings if one is given.
    for field, spec in SamlUserdata.schema()['properties'].items():
        # Skip hardcoded values (see above).
        if field in values:
            continue

        key = aliases.get(field, field)
        value = raw_userdata[key]

        # SAML assertions tend to return lists of things, even if we should
        # only expect one single value. Fix that here, unless our standard
        # schema actually expects a list.
        if spec['type'] != 'array' and isinstance(value, list):
            value = value[0]

        values[field] = value

    return SamlUserdata.parse_obj(values)



## -- LOCAL DEVELOPMENT CODE --------------------------------------------------

# Development SAML2 IDP endpoint.
dev_saml_idp = FastAPI()


def _decode_saml_req(enc: str):
    """Decode a deflated/encoded SAML2 request.

    Args:
        enc - String that contains b64-encoded / compressed request

    Returns:
        XML Etree with decoded object.
    """
    saml_req = OneLogin_Saml2_Utils.decode_base64_and_inflate(enc)
    return etree.fromstring(saml_req)


def _encode_saml_resp(raw: etree.Element):
    """Encode a SAML2 response.

    Args:
        raw: Root element of the SAML2 request (XML)

    Returns:
        Base64-encoded response (not deflated)
    """
    s = etree.tostring(raw)
    return OneLogin_Saml2_Utils.b64encode(s)


@dev_saml_idp.get("/sso", response_class=HTMLResponse)
def get_sso(request: Request):
    """For local development, mock out a SAML SSO form."""
    xml = _decode_saml_req(request.query_params.get('SAMLRequest'))
    acs = xml.get('AssertionConsumerServiceURL'),
    if not acs:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="missing acs")
    id_ = xml.get('ID')

    session = request.scope.get('dbsession')
    users = session.query(User).order_by(User.username.asc()).all()

    return templates.TemplateResponse("saml_dev_sso.html", {
        'request': request,
        'acs': acs[0],
        'id': id_[0],
        'users': [u for u in users],
        })


@dev_saml_idp.post("/login")
async def post_login(request: Request):
    """For local development, mock a POST-redirect to the home page."""
    form = await request.form()
    assertion = templates.get_template("saml_dev_assertion.xml").render({
        'id_': form['id'],
        'uid': OneLogin_Saml2_Utils.generate_unique_id(),
        'name_id': form['nameId'],
        'acs': form['acs'],
        'given_name': form['givenName'],
        'surname': form['surname'],
        'issuer': settings.saml['idp']['entityId'],
        'sp': settings.saml['sp']['entityId'],
        'not_before': datetime.utcnow().isoformat() + 'Z',
        'not_after': (datetime.utcnow() + timedelta(minutes=5)).isoformat() + 'Z',
        'email': form['email'],
        'is_admin': form.get('admin', None) is not None,
        })

    # Sign the assertion
    signed_assertion = OneLogin_Saml2_Utils.add_sign(assertion,
            settings.saml['idp']['privateKey'],
            settings.saml['idp']['x509cert'],
            debug=True)

    full_resp = templates.get_template("saml_dev_response.xml").render({
        'id_': form['id'],
        'uid': OneLogin_Saml2_Utils.generate_unique_id(),
        'issuer': settings.saml['idp']['entityId'],
        'acs': form['acs'],
        'assertion': signed_assertion.decode('utf-8'),
        })

    return templates.TemplateResponse("saml_dev_redirect.html", {
        'request': request,
        'acs': form['acs'],
        'content': _encode_saml_resp(etree.fromstring(full_resp)),
        'dest': '/',
        })
