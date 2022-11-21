import os
from typing import Optional

from pydantic import BaseModel, BaseSettings



class SmtpSettings(BaseModel):
    # Turn on the mock to skip sending real emails. Handy for development.
    # Turn this off in production!
    mock: bool = True
    # SMTP host
    host: str = "localhost"
    # SMTP port on the remote server
    port: int = 25


class EmailTemplate(BaseModel):
    # Email subject
    subject: str
    # Email body
    body: str


class EmailSettings(BaseModel):
    # Settings for email server
    smtp: SmtpSettings = SmtpSettings()
    # Send-from address for the app's messages
    send_from_address: str = "no-reply@localhost"
    send_from_display_name: str = "Reporting Tool"
    # Base URL of web service to include in the email links
    base_url: str = "http://localhost:3000"
    # Email template for sending welcome message
    welcome_tpl: EmailTemplate = EmailTemplate(
        subject="Your new reporting tool account!",
        body="""
            <html>
                <head></head>
                <body>
                    <p>Welcome to the Reporting Tool!</p>
                    <p>Your login credentials are:</p>
                    <p>Username: <strong>{email}</strong></p>
                    <p>Password: <strong>{password}</strong></p>
                    <p>You can log in here: <a href="{login_url}">{login_url}</a></p>
                    <p>Cheers!</p>
                </body>
            </html>
            """,
    )
    # Email template for sending password reset message
    reset_password_tpl: EmailTemplate = EmailTemplate(
        subject="Your password reset token",
        body="""
            <html>
                <head></head>
                <body>
                    <p>To reset your password please follow this link:</p>
                    <p><a href="{reset_url}">{reset_url}</a></p>
                    <p>If you did not request to reset your password you can ignore this email.</p>
                </body>
            </html>
            """,
    )
    # Email template for verifying the user's email
    verify_request_tpl: EmailTemplate = EmailTemplate(
        subject="Please verify your email address",
        body="""
            <html>
                <head></head>
                <body>
                    <p>To verify your email address please follow this link:</p>
                    <p><a href="{verify_url}">{verify_url}</a></p>
                    <p>If you have already verified your email please ignore this message.</p>
                </body>
            </html>
            """,
    )
    # Email template for confirming that the user's email was verified.
    verify_confirm_tpl: EmailTemplate = EmailTemplate(
        subject="Your email has been verified!",
        body="""
            <html>
                <head></head>
                <body>
                    <p>Your email has been verified. Thank you!</p>
                </body>
            </html>
            """,
    )


class ImageAsset(BaseModel):
    """Describe an image reference for the front-end."""
    # URL can be any of the following:
    #  - A full URL to the image path;
    #  - An absolute path on the server (e.g., "/img/foo.png")
    #  - A relative path on the server (e.g., "foo.png")
    # If a relative path is given, it should be combined with the `static_base`
    # in the AppConfig to find the full URL.
    url: str
    # Alt-text to display if image fails to load / for screen readers.
    alt: str
    # Ideal width of image (px)
    width: Optional[int]
    # Ideal height of image (px)
    height: Optional[int]


class AppConfig(BaseModel):
    """Front-end application configuration."""
    # Email that should be displayed for users to send questions/feedback to.
    help_email: str = "help@foo.org"
    # URL to use for SSO authentication.
    sso_url: str = "/api/sso"
    # Base URL to use for fetching assets. Might differ between local, dev,
    # and production environments.
    static_base: str = "/api/static/"
    # Custom stylesheet to use on the front-end.
    theme: Optional[str]
    # Image to use for header logo of the app.
    logo: ImageAsset = ImageAsset(
            url="logo.png",
            alt="Reporting Tool Logo",
            width=55)


class Settings(BaseSettings):
    db_user: str = "postgres"
    db_pw: str = "postgres"
    db_host: str = "localhost"
    db_name: str = "rt"
    debug: bool = True

    app_account_pw: str = ""

    app_secret: str = "shhhhhh its a secret"

    app_config: AppConfig = AppConfig()

    host: str = "localhost:3000"
    saml: dict = {}
    saml_userdata: dict = {}

    # Whether to send cookies over HTTPS only. This should generally be turned
    # on in production.
    use_secure_cookies: bool = False

    email: EmailSettings = EmailSettings()

    class Config:
        secrets_dir = os.getenv("RT_SECRETS_DIR", "/run/secrets")
        env_file = ".env"
        env_file_encoding = "utf-8"
        env_prefix = "rt_"


settings = Settings()
