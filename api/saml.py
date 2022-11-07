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

from settings import settings
from templates import templates



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



# Development SAML2 IDP endpoint.
dev_saml_idp = FastAPI()

# Namespaces used for SAML requests.
_nsmap = {
        'samlp': 'urn:oasis:names:tc:SAML:2.0:protocol',
        'saml': 'urn:oasis:names:tc:SAML:2.0:assertion',
        'ds': 'http://www.w3.org/2000/09/xmldsig#',
        }

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
    return templates.TemplateResponse("saml_dev_sso.html", {
        'request': request,
        'acs': acs[0],
        'id': id_[0],
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
        'dest': '',
        })
