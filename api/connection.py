from settings import settings
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from lazy_object_proxy import Proxy

from database import create_tables


def init_db():
    """Get a connection to the database.
    When this method is run, if the database does not exist, it will create
    the database and all of the required tables.
    :returns: Session factory
    """
    db_url_tpl = f"{settings.db_user}:{settings.db_pw}@{settings.db_host}/%s"
    db_driver = 'postgresql+psycopg2://'
    db_args = {
            'pool_pre_ping': True,
            }

    db_url = db_url_tpl % settings.db_name
    needs_tables = False
    try:
        engine = create_engine(db_driver + db_url, **db_args)
        with engine.connect():
            pass
    except OperationalError:
        # If the database doesn't exist, connect to the DB without specifying
        # a database and create it.
        engine = create_engine(db_driver + db_url_tpl % "", **db_args)
        with engine.connect() as conn:
            conn.connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            conn.execute("""
                CREATE DATABASE %s ENCODING 'utf8'
            """ % settings.db_name)
        engine.dispose()
        # Now try to connect to the new database again.
        engine = create_engine(db_driver + db_url, **db_args)


    # Now check if the tables exist
    try:
        with engine.connect() as conn:
            conn.execute("""
                SELECT 1 FROM organization
            """)
    except ProgrammingError:
        needs_tables = True

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Create all of the tables if this is a new DB.
    if needs_tables:
        s = SessionLocal()
        create_tables(s)
        s.close()

    return SessionLocal


# TODO: upgrade to use async database:
connection = Proxy(init_db)
