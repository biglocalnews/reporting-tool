"""
Run this as a script to create the database tables:
    python seed.py

Can also add dummy data for development with:
    python seed.py --dummy-data
"""

from lazy_object_proxy import Proxy
from settings import settings
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import click
from datetime import datetime
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from database import (
    Base,
    Organization,
    Team,
    Program,
    Dataset,
    User,
    Role,
    Category,
    CategoryValue,
    Tag,
    Target,
    Track,
    PersonType,
    Record,
    Entry,
)


def init_db():
    """Get a connection to the database.

    When this method is run, if the database does not exist, it will create
    the database and all of the required tables.

    :returns: Session factory
    """
    db_url_tpl = f"{settings.db_user}:{settings.db_pw}@{settings.db_host}/%s"
    db_driver = "postgresql+psycopg2://"
    db_args = {
        "pool_pre_ping": True,
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
            conn.execute(
                """
                CREATE DATABASE %s ENCODING 'utf8'
            """
                % settings.db_name
            )
        engine.dispose()
        # Now try to connect to the new database again.
        engine = create_engine(db_driver + db_url, **db_args)

    # Now check if the tables exist
    try:
        with engine.connect() as conn:
            conn.execute(
                """
                SELECT 1 FROM organization
            """
            )
    except ProgrammingError:
        needs_tables = True

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Create all of the tables if this is a new DB.
    if needs_tables:
        s = SessionLocal()
        create_tables(s)
        s.close()

    return SessionLocal


# Get a connection to the database. This connection is lazily initialized the
# first time it's needed, and will ensure the existence of the database and
# tables.
# TODO: upgrade to use async database:
# https://app.clubhouse.io/stanford-computational-policy-lab/story/302/use-async-db-calls
connection = Proxy(init_db)


_blank_slate = True


def is_blank_slate(session):
    """Check if the app has been initialized at all.

    If the app has been initialized, this returns False and future lookups are
    cached. Otherwise it checks each time and returns True.

    :returns: True if app needs to be initialized.
    """
    global _blank_slate
    if not _blank_slate:
        return False

    org_count = session.query(Organization).count()

    if org_count > 0:
        _blank_slate = False
        return False

    return True


def clear_cached_state():
    """Reset cached state. (Useful for testing.)"""
    global _blank_slate
    _blank_slate = True


def create_tables(session):
    """Initialize the database with tables and objects.

    :param session: Database session
    """
    print("🍽  Creating tables ...")
    engine = session.bind
    Base.metadata.create_all(engine)

    # Default roles
    session.add(
        Role(
            id="be5f8cac-ac65-4f75-8052-8d1b5d40dffe",
            name="admin",
            description="User is an admin and has administrative privileges",
        )
    )

    session.add(
        Role(
            id="ee2de3ff-e147-453c-b49c-88122e112095",
            name="publisher",
            description="User can publish records",
        )
    )

    # Default demographic categories
    session.add(
        Category(
            id="51349e29-290e-4398-a401-5bf7d04af75e",
            name="gender",
            description=(
                "Gender: A social construct based on a group of emotional and "
                "psychological characteristics that classify an individual as "
                "feminine, masculine, androgynous or other. Gender can be "
                "understood to have several components, including gender identity, "
                "gender expression and gender role."
            ),
        )
    )
    session.add(
        Category(
            id="2f98f223-417f-41ea-8fdb-35f0c5fe5b41",
            name="ethnicity",
            description=(
                "Race & Ethnicity: Social constructs that categorize groups of "
                "people based on shared social and physical qualities. Definitions "
                "of race and ethnicity are not universally agreed upon and vary "
                "over time and place. Individuals may identify as belonging to "
                "multiple racial and ethnic groups."
            ),
        )
    )
    session.add(
        Category(
            id="55119215-71e9-43ca-b2c1-7e7fb8cec2fd",
            name="disability",
            description=(
                "A disability is any condition of the body or mind (impairment) "
                "that makes it more difficult for the person with the condition "
                "to do certain activities (activity limitation) and interact with "
                "the world around them (participation restrictions). Some "
                "disabilities may be hidden or not easy to see."
            ),
        )
    )

    session.commit()


def create_dummy_data(session):
    """Create dummy data for testing and development.

    :param session: Database session
    """
    if not settings.debug:
        raise RuntimeError("Can't add dummy data when not in a debug environment")

    from passlib.hash import bcrypt

    def hash_test_password(pw: str) -> str:
        # NOTE: Use consistent salt and rounds to eliminate non-determinism in
        # testing. This is obviously not intended to be secure.
        return bcrypt.hash(pw, salt="0" * 22, rounds=4)

    print("👩🏽‍💻 Adding dummy data ...")
    user = User(
        id="cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
        email="tester@notrealemail.info",
        username="tester@notrealemail.info",
        hashed_password=hash_test_password("password"),
        first_name="Cat",
        last_name="Berry",
        last_changed_password=datetime.now(),
        last_login=datetime.now(),
    )

    # Secondary app user (no perms, used for testing access controls)
    other_user = User(
        id="a47085ba-3d01-46a4-963b-9ffaeda18113",
        email="other@notrealemail.info",
        username="other@notrealemail.info",
        hashed_password=hash_test_password("otherpassword"),
        first_name="Penelope",
        last_name="Pineapple",
        last_changed_password=datetime.now(),
        last_login=datetime.now(),
    )
    session.add(other_user)

    # Admin user
    admin_user = User(
        id="df6413b4-b910-4f6e-8f3c-8201c9e65af3",
        email="admin@notrealemail.info",
        username="admin@notrealemail.info",
        hashed_password=hash_test_password("adminpassword"),
        first_name="Daisy",
        last_name="Carrot",
        last_changed_password=datetime.now(),
        last_login=datetime.now(),
        roles=[],
    )
    admin_role = session.query(Role).get("be5f8cac-ac65-4f75-8052-8d1b5d40dffe")
    admin_user.roles.append(admin_role)
    session.add(admin_user)

    ds1 = Dataset(
        id="b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89",
        name="Breakfast Hour",
        description="breakfast hour programming",
    )
    ds2 = Dataset(
        id="96336531-9245-405f-bd28-5b4b12ea3798",
        name="12PM - 4PM",
        description="afternoon programming",
    )

    program = Program(
        id="1e73e788-0808-4ee8-9b25-682b6fa3868b",
        name="BBC News",
        description="All BBC news programming",
        reporting_period_type="monthly",
        datasets=[ds1, ds2],
    )

    team = Team(
        id="472d17da-ff8b-4743-823f-3f01ea21a349",
        name="News Team",
        users=[user],
        programs=[program],
    )

    org = Organization(
        id="15d89a19-b78d-4ee8-b321-043f26bdd48a", name="BBC", teams=[team]
    )

    Tag(
        id="4a2142c0-5416-431d-b62f-0dbfe7574688",
        name="News Channels",
        description="tag for all news programming",
        tag_type="news",
        programs=[program],
        datasets=[ds1, ds2],
    )

    category_gender = session.query(Category).get(
        "51349e29-290e-4398-a401-5bf7d04af75e"
    )
    category_disability = session.query(Category).get(
        "55119215-71e9-43ca-b2c1-7e7fb8cec2fd"
    )
    category_ethnicity = session.query(Category).get(
        "2f98f223-417f-41ea-8fdb-35f0c5fe5b41"
    )

    target_gender = Target(
        program=program,
        category=category_gender,
        target_date=datetime.strptime("2022-12-31 00:00:00", "%Y-%m-%d %H:%M:%S"),
        target=float(0.5),
    )

    target_disabled = Target(
        program=program,
        category=category_disability,
        target_date=datetime.strptime("2022-12-31 00:00:00", "%Y-%m-%d %H:%M:%S"),
        target=float(0.12),
    )

    target_ethnicity = Target(
        program=program,
        category=category_ethnicity,
        target_date=datetime.strptime("2022-12-31 00:00:00", "%Y-%m-%d %H:%M:%S"),
        target=float(0.20),
    )

    track_non_binary = Track(
        id="40eaeafc-3311-4294-a639-a826eb6495ab",
        target=target_gender,
        target_member=False,
    )
    track_cis_women = Track(
        id="eccf90e8-3261-46c1-acd5-507f9113ff72",
        target=target_gender,
        target_member=False,
    )
    track_cis_men = Track(
        id="2d501688-92e3-455e-9685-01141de3dbaf",
        target=target_gender,
        target_member=False,
    )
    track_trans_women = Track(
        id="4f7897c2-32a1-4b1e-9749-1a8066faca01",
        target=target_gender,
        target_member=False,
    )
    track_trans_men = Track(
        id="9352b16b-2607-4f7d-a272-fe6dedd8165a",
        target=target_gender,
        target_member=False,
    )
    track_gender_non_conforming = Track(
        id="a459ed7f-5573-4d5b-ade6-3070bc8bd2db",
        target=target_gender,
        target_member=False,
    )
    track_disabled = Track(
        id="b5be10ce-103f-41f2-b4c4-603228724993",
        target=target_disabled,
        target_member=True,
    )
    track_non_disabled = Track(
        id="6e6edce5-3d24-4296-b929-5eec26d52afc",
        target=target_disabled,
        target_member=False,
    )

    entry1 = Entry(id="64677dc1-a1cd-4cd3-965d-6565832d307a", count=1, inputter=user)
    entry2 = Entry(id="a37a5fe2-1493-4cb9-bcd0-a87688ffa409", count=1, inputter=user)
    entry3 = Entry(id="423dc42f-4628-40e4-b9cd-4e6e9e384d61", count=1, inputter=user)
    entry4 = Entry(id="407f24d0-c5eb-4297-9495-90e325a00a1d", count=1, inputter=user)
    entry5 = Entry(id="4adcb9f9-c1eb-41ba-b9aa-ed0947311a24", count=1, inputter=user)
    entry6 = Entry(id="1c49c64f-51e6-48fe-af10-69aaeeddc55f", count=1, inputter=user)
    entry7 = Entry(id="335b3680-13a1-4d8f-a917-01e1e7e1311a", count=1, inputter=user)
    entry8 = Entry(id="fa5f1f0e-d5ba-4f2d-bdbf-819470a6fa4a", count=1, inputter=user)
    entry1_b = Entry(id="9a323df8-15cf-45c2-a8c6-755b7d98332b", count=1, inputter=user)
    entry2_b = Entry(id="4c672b25-02da-4d48-bece-26b45fff9a03", count=1, inputter=user)
    entry3_b = Entry(id="21d12404-a1b7-40c0-9598-5dc853adbb9b", count=1, inputter=user)
    entry4_b = Entry(id="98aecacd-9eea-4d08-9b0d-a80c57db3b74", count=1, inputter=user)
    entry5_b = Entry(id="0ef0e83a-81b2-4c05-82d5-2fc5d8714368", count=1, inputter=user)
    entry6_b = Entry(id="4f07ef7f-70ec-4c04-9f57-fd692ab430d2", count=1, inputter=user)
    entry7_b = Entry(id="201d163a-873c-4196-9056-18e66eab37c7", count=1, inputter=user)
    entry8_b = Entry(id="d7f57989-cf6e-4384-93d4-773d71137e0d", count=1, inputter=user)

    CategoryValue(
        id="742b5971-eeb6-4f7a-8275-6111f2342bb4",
        name="women",
        category=category_gender,
        tracks=[track_cis_women],
        entries=[entry2, entry2_b],
    )
    CategoryValue(
        id="d237a422-5858-459c-bd01-a0abdc077e5b",
        name="men",
        category=category_gender,
        tracks=[track_cis_men],
        entries=[entry3, entry3_b],
    )
    CategoryValue(
        id="662557e5-aca8-4cec-ad72-119ad9cda81b",
        name="trans women",
        category=category_gender,
        tracks=[track_trans_women],
        entries=[entry4, entry4_b],
    )
    CategoryValue(
        id="1525cce8-7db3-4e73-b5b0-d2bd14777534",
        name="trans men",
        category=category_gender,
        tracks=[track_trans_men],
        entries=[entry5, entry5_b],
    )
    CategoryValue(
        id="a72ced2b-b1a6-4d3d-b003-e35e980960df",
        name="gender non-conforming",
        category=category_gender,
        tracks=[track_gender_non_conforming],
        entries=[entry6, entry6_b],
    )
    CategoryValue(
        id="6cae6d26-97e1-4e9c-b1ad-954b4110e83b",
        name="non-binary",
        category=category_gender,
        tracks=[track_non_binary],
        entries=[entry1, entry1_b],
    )
    CategoryValue(
        id="c36958cb-cc62-479e-ab61-eb03896a981c",
        name="disabled",
        category=category_disability,
        tracks=[track_disabled],
        entries=[entry7, entry7_b],
    )
    CategoryValue(
        id="55119215-71e9-43ca-b2c1-7e7fb8cec2fd",
        name="non-disabled",
        category=category_disability,
        tracks=[track_non_disabled],
        entries=[entry8, entry8_b],
    )

    category_value_white = CategoryValue(
        id="0034d015-0652-497d-ab4a-d42b0bdf08cb",
        name="white",
        category=category_ethnicity,
    )

    # datetime.strptime converts a string to a datetime object bc of SQLite DateTime limitation- must be explicit about format
    Record(
        id="742b5971-eeb6-4f7a-8275-6111f2342bb4",
        dataset=ds1,
        publication_date=datetime.strptime("2020-12-21 00:00:00", "%Y-%m-%d %H:%M:%S"),
        entries=[
            entry1,
            entry2,
            entry3,
            entry4,
            entry5,
            entry6,
            entry7,
            entry8,
            entry1_b,
            entry2_b,
            entry3_b,
            entry4_b,
            entry5_b,
            entry6_b,
            entry7_b,
            entry8_b,
        ],
    )

    PersonType(
        id="1c9b9573-726f-46c4-86a8-ed6412eb0c35",
        person_type_name="BBC Contributor",
        datasets=[ds1],
        entries=[entry1, entry2, entry3, entry4, entry5, entry6, entry7, entry8],
    )
    PersonType(
        id="59bf75ad-f5b9-4b21-94e5-659896ebe2b5",
        person_type_name="Non-BBC Contributor",
        datasets=[ds1],
        entries=[
            entry1_b,
            entry2_b,
            entry3_b,
            entry4_b,
            entry5_b,
            entry6_b,
            entry7_b,
            entry8_b,
        ],
    )

    session.add(category_value_white)
    session.add(org)
    session.commit()


@click.command()
@click.option("--dummy-data/--no-dummy-data", default=False)
def run(dummy_data: bool):
    """Create tables and dummy data (if requested)."""
    # Database and tables are created automatically when connecting if they
    # don't already exist.
    session = connection()

    if dummy_data:
        create_dummy_data(session)

    print("✅ done!")


if __name__ == "__main__":
    run()
