from pydantic import BaseModel
from pydantic_settings import load_settings, BaseSettingsModel
from dotenv import load_dotenv


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


class Settings(BaseSettingsModel):
    db_user: str = "postgres"
    db_pw: str = "pass"
    db_host: str = "localhost"
    db_name: str = "bbc"
    debug: bool = True

    app_account_pw: str = ""

    secret: str = "shhhhhh its a secret"

    # Whether to send cookies over HTTPS only. This should generally be turned
    # on in production.
    use_secure_cookies: bool = False

    email: EmailSettings = EmailSettings()

    class Config:
        env_prefix = "RT"
        secrets_dir = "/run/secrets"


# Only load dotenv from this directory (not parent directories). If it doesn't
# exist, this is a no-op.
# NOTE: not using Pydantic's own dotenv parser because it misses nested keys.
# https://github.com/samuelcolvin/pydantic/issues/2304
load_dotenv(".env")


settings = load_settings(
    Settings,
    load_env=True,
)
