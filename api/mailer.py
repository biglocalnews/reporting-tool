import aiosmtplib
import urllib.parse
from email.message import EmailMessage
from email.headerregistry import Address
from html2text import HTML2Text

from user import UserDBModel
from settings import settings


# HTML to simple text renderer
render_html_as_text = HTML2Text()
render_html_as_text.ignore_links = True
render_html_as_text.strong_mark = ""


def make_url(path: str, **kwargs) -> str:
    """Make a URL to this service with the given path and query params.

    :param path: URL path
    :param **kwargs: Query parameters to encode
    """
    url = f"{settings.email.base_url}{path}"
    if kwargs:
        first = True
        for k, v in kwargs.items():
            if first:
                url += "?"
                first = False
            else:
                url += "&"
            url += f"{k}={urllib.parse.quote_plus(v)}"
    if settings.debug:
        print("[Formatted URL for email]", url)
    return url


def get_address_from_user(user: UserDBModel) -> Address:
    """Get a formatted address from the user.

    :param user: User database object
    :returns: Email Address object
    """
    return Address(
            display_name=f"{user.first_name} {user.last_name}",
            addr_spec=user.email)


def create_email(to: Address, subject: str, body: str) -> EmailMessage:
    """Construct a new email from the default sender.

    The body of the email is expected to be HTML. It will be rendered to
    plain text for older clients.

    :param to: Destination email address
    :param subject: Email subject line
    :param body: Email body as HTML
    :returns: New email object
    """
    email = EmailMessage()
    email["From"] = Address(
            display_name=settings.email.send_from_display_name,
            addr_spec=settings.email.send_from_address)
    email["To"] = to
    email["Subject"] = subject
    email.set_content(render_html_as_text.handle(body))
    email.add_alternative(body, subtype="html")
    return email


async def send_email(email: EmailMessage):
    """Send the given email, asynchronously."""
    if settings.email.smtp.mock:
        print(f"[Mock SMTP] Would have sent the following email:\n\n{email}\n\n")
        return
    await aiosmtplib.send(email,
            hostname=settings.email.smtp.host,
            port=settings.email.smtp.port)


async def send_register_email(to_user: UserDBModel, password: str):
    """Send an email notifying a user of their new account.

    :param to_user: User model of the new account
    :param password: Temporary password that was created for the user
    """
    tpl = settings.email.welcome_tpl
    body = tpl.body.format(
            email=to_user.email,
            password=password,
            login_url=make_url("/login"))
    msg = create_email(
            to=get_address_from_user(to_user),
            subject="Your new reporting tool account",
            body=body)
    await send_email(msg)


async def send_password_reset_email(to_user: UserDBModel, token: str):
    """Send an email with the password reset token.

    :param to_user: User model of the person who forgot their password
    :param token: Reset token
    """
    tpl = settings.email.reset_password_tpl
    body = tpl.body.format(
            reset_url=make_url("/account/reset-password",
                email=to_user.email,
                token=token))
    msg = create_email(
            to=get_address_from_user(to_user),
            subject=tpl.subject,
            body=body)
    await send_email(msg)


async def send_verify_request_email(to_user: UserDBModel, token: str):
    """Send an email requesting the user to verify their email.

    :param to_user: User model of the person to verify
    :param token: Verification token
    """
    tpl = settings.email.verify_request_tpl
    body = tpl.body.format(
            verify_url=make_url("/account/verify",
                email=to_user.email,
                token=token))
    msg = create_email(
            to=get_address_from_user(to_user),
            subject=tpl.subject,
            body=body)
    await send_email(msg)


async def send_verify_confirm_email(to_user: UserDBModel):
    """Confirm that a user's email was verified.

    :param to_user: User model of the person who verified their email
    """
    tpl = settings.email.verify_confirm_tpl
    msg = create_email(
            to=get_address_from_user(to_user),
            subject=tpl.subject,
            body=tpl.body)
    await send_email(msg)
