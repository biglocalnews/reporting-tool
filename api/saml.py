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


@dev_saml_idp.get("/sso")
def get_sso(request: Request):
    xml = _decode_saml_req(request.query_params.get('SAMLRequest'))
    print(etree.tostring(xml))
    acs = xml.get('AssertionConsumerServiceURL'),
    if not acs:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="missing acs")
    id_ = xml.get('ID')
    return HTMLResponse("""
    <html>
        <body>
            <form name="login" action="/api/__dev__/saml/login" method="POST">
                <input type="hidden" name="acs" value="{acs}" />
                <input type="hidden" name="id" value="{id_}" />
                <div>
                    <input type="text" name="nameId" value="test_user" />
                </div>
                <div>
                    <input type="text" name="givenName" value="Lactarius" />
                    <input type="text" name="surname" value="Rubidus" />
                </div>
                <div>
                    <input type="text" name="email" value="test@rt.dev" />
                </div>
                <div>
                    <input type="submit" value="log in" />
                </div>
            </form>
        </body>
    </html>
    """.format(acs=acs[0], id_=id_[0]))


@dev_saml_idp.post("/login")
async def post_login(request: Request):
    form = await request.form()
    assertion = """
  <saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" ID="{uid}" Version="2.0" IssueInstant="2014-07-17T01:01:48Z">
    <saml:Issuer>{issuer}</saml:Issuer>
    <saml:Subject>
      <saml:NameID SPNameQualifier="{sp}" Format="urn:oasis:names:tc:SAML:2.0:nameid-format:transient">{name_id}</saml:NameID>
      <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
        <saml:SubjectConfirmationData NotOnOrAfter="{not_after}" Recipient="{acs}" InResponseTo="{id_}"/>
      </saml:SubjectConfirmation>
    </saml:Subject>
    <saml:Conditions NotBefore="{not_before}" NotOnOrAfter="{not_after}">
      <saml:AudienceRestriction>
        <saml:Audience>{sp}</saml:Audience>
      </saml:AudienceRestriction>
    </saml:Conditions>
    <saml:AuthnStatement AuthnInstant="{not_before}" SessionNotOnOrAfter="{not_after}" SessionIndex="_be9967abd904ddcae3c0eb4189adbe3f71e327cf93">
      <saml:AuthnContext>
        <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:Password</saml:AuthnContextClassRef>
      </saml:AuthnContext>
    </saml:AuthnStatement>
    <saml:AttributeStatement>
      <saml:Attribute Name="uid" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue xsi:type="xs:string">{name_id}</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="mail" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue xsi:type="xs:string">{email}</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="givenName" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue xsi:type="xs:string">{given_name}</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="surname" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue xsi:type="xs:string">{surname}</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="roles" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue xsi:type="xs:string">admin</saml:AttributeValue>
        <saml:AttributeValue xsi:type="xs:string">staff</saml:AttributeValue>
      </saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
    """.format(
            id_=form['id'],
            uid=OneLogin_Saml2_Utils.generate_unique_id(),
            name_id=form['nameId'],
            acs=form['acs'],
            given_name=form['givenName'],
            surname=form['surname'],
            issuer=settings.saml['idp']['entityId'],
            sp=settings.saml['sp']['entityId'],
            not_before=datetime.utcnow().isoformat() + 'Z',
            not_after=(datetime.utcnow() + timedelta(minutes=5)).isoformat() + 'Z',
            email=form['email'],
            )

    # Sign the assertion
    signed_assertion = OneLogin_Saml2_Utils.add_sign(assertion,
            settings.saml['idp']['privateKey'],
            settings.saml['idp']['x509cert'],
            debug=True)

    full_resp = """
    <samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="{uid}" Version="2.0" IssueInstant="2014-07-17T01:01:48Z" Destination="{acs}" InResponseTo="{id_}">
      <saml:Issuer>{issuer}</saml:Issuer>
      <samlp:Status>
        <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
      </samlp:Status>
      {assertion}
    </samlp:Response>
    """.format(
        id_=form['id'],
        uid=OneLogin_Saml2_Utils.generate_unique_id(),
        issuer=settings.saml['idp']['entityId'],
        acs=form['acs'],
        assertion=signed_assertion.decode('utf-8'),
        )

    print("RESP==\n\n", full_resp, "\n\n")

    return HTMLResponse("""
    <html>
        <body>
            <form name="saml" action="{acs}" method="POST">
                <input type="hidden" name="SAMLResponse" value="{content}" />
                <input type="hidden" name="RelayState" value="{dest}" />
            </form>
            <script type="text/javascript">
                document.forms[0].submit();
            </script>
        </body>
    </html>
    """.format(
            acs=form['acs'],
            content=_encode_saml_resp(etree.fromstring(full_resp)),
            dest="",
            ))

