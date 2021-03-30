from pydantic import BaseSettings


class Settings(BaseSettings):
    db_user: str = 'postgres'
    db_pw: str = 'pass'
    db_host: str = 'localhost'
    db_name: str = 'bbc'

    secret: str = 'shhhhhh its a secret'


settings = Settings()