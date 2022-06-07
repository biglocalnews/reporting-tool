from settings import settings
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from lazy_object_proxy import Proxy


def init_db():

    db_url_tpl = f"{settings.db_user}:{settings.db_pw}@{settings.db_host}/%s"
    db_driver = "postgresql+psycopg2://"
    db_args = {
        "pool_pre_ping": True,
    }

    db_url = db_url_tpl % settings.db_name

    try:
        engine = create_engine(db_driver + db_url, **db_args)
        with engine.connect():
            pass
    except OperationalError as op_err:
        # todo reconnects?
        print(op_err)
        exit(1)

    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


# TODO: upgrade to use async database:
connection = Proxy(init_db)
