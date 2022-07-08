from settings import settings
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from lazy_object_proxy import Proxy
import logging
import time


def init_db():

    db_url_tpl = f"{settings.db_user}:{settings.db_pw}@{settings.db_host}/%s"
    db_driver = "postgresql+psycopg2://"
    db_args = {"pool_pre_ping": True}

    db_url = db_url_tpl % settings.db_name

    connection_attempts = 0

    while True:
        try:
            logging.info("create session engine")
            connection_attempts += 1
            engine = create_engine(db_driver + db_url, **db_args)
            with engine.connect():
                pass
        except Exception as op_err:
            # todo reconnects?
            logging.error("failed to connect")
            if connection_attempts > 14:
                raise op_err
            time.sleep(1 if connection_attempts < 10 else 10)
            continue
        break

    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


# TODO: upgrade to use async database:
connection = Proxy(init_db)
