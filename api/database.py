"""Define and manage database schema.

Run this as a script to create the database tables:
    python database.py

Can also add dummy data for development with:
    python database.py --dummy-data
"""
import uuid
import click
from datetime import datetime
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy import (
    create_engine,
    Table,
    Column,
    Integer,
    Float,
    String,
    DateTime,
    Text,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import (
    relationship,
    selectinload,
    sessionmaker,
    validates,
    with_loader_criteria,
)
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy import create_engine
from sqlalchemy.sql import func
from sqlalchemy.sql.expression import null
from sqlalchemy.sql.sqltypes import TIMESTAMP, Boolean
from fastapi_users.db.sqlalchemy import GUID
from fastapi_users.db import SQLAlchemyBaseUserTable
from lazy_object_proxy import Proxy

from settings import settings


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


Base = declarative_base()

# Handling Many-to-Many Relationships
user_teams = Table(
    "user_team",
    Base.metadata,
    Column("user_id", GUID, ForeignKey("user.id"), index=True),
    Column("team_id", GUID, ForeignKey("team.id", ondelete="CASCADE"), index=True),
)

user_roles = Table(
    "user_role",
    Base.metadata,
    Column("user_id", GUID, ForeignKey("user.id"), index=True),
    Column("role_id", GUID, ForeignKey("role.id"), index=True),
)

dataset_tags = Table(
    "dataset_tag",
    Base.metadata,
    Column("dataset_id", GUID, ForeignKey("dataset.id"), index=True),
    Column("tag_id", GUID, ForeignKey("tag.id"), index=True),
)

program_tags = Table(
    "program_tag",
    Base.metadata,
    Column("program_id", GUID, ForeignKey("program.id"), index=True),
    Column("tag_id", GUID, ForeignKey("tag.id"), index=True),
)

dataset_person_types = Table(
    "dataset_person_type",
    Base.metadata,
    Column("dataset_id", GUID, ForeignKey("dataset.id"), index=True),
    Column("person_type_id", GUID, ForeignKey("person_type.id"), index=True),
)


class PermissionsMixin:
    """Base class defining some common permissions checks."""

    def user_is_team_member(self, user: "Optional[User]") -> bool:
        """Check whether a user can access an object through their team.

        :param user: User object (could be None)
        :returns: True if user's team has permission to see the object
        """
        return False


class Organization(Base):
    __tablename__ = "organization"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    teams = relationship("Team")

    created = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)


class Team(Base, PermissionsMixin):
    __tablename__ = "team"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    users = relationship("User", secondary=user_teams, backref="Team")
    programs = relationship("Program", back_populates="team")
    organization_id = Column(
        GUID, ForeignKey("organization.id"), nullable=False, index=True
    )
    organization = relationship("Organization", back_populates="teams")

    created = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)

    def user_is_team_member(self, user):
        if not user:
            return False
        return self in user.teams


class User(Base, SQLAlchemyBaseUserTable):
    __tablename__ = "user"

    username = Column(String(length=50), unique=True, index=True, nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    roles = relationship("Role", secondary=user_roles, backref="User")
    teams = relationship("Team", secondary=user_teams, backref="User")
    last_login = Column(TIMESTAMP, nullable=True)
    last_changed_password = Column(TIMESTAMP, nullable=True)

    created = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)

    @classmethod
    def get_full_name(user):
        return f"{user.first_name} {user.last_name}"

    @classmethod
    def get_by_email(cls, session, email: str) -> "Optional[User]":
        """Get a user by their email address.

        :param email:
        :returns: User, if one was found
        """
        return (
            session.query(User)
            .filter(
                User.email == email,
                User.deleted == None,
            )
            .first()
        )

    @classmethod
    def get_by_username(cls, session, username: str) -> "Optional[User]":
        """Get a user by their email address.

        :param email:
        :returns: User, if one was found
        """
        return (
            session.query(User)
            .filter(
                User.username == username,
                User.deleted == None,
            )
            .one_or_none()
        )

    @classmethod
    def delete(cls, session, id) -> None:
        """Delete a user by their ID.

        This is a soft delete; the record will stay in the database.

        :param session: Database session
        :param id: UUID of user
        """
        return (
            session.query(User)
            .filter(User.id == id)
            .update(
                {
                    User.is_active: False,
                    User.deleted: func.now(),
                },
                synchronize_session="fetch",
            )
        )


class Role(Base):
    __tablename__ = "role"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=False)

    created = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)


class Program(Base, PermissionsMixin):
    __tablename__ = "program"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=False)
    team_id = Column(GUID, ForeignKey("team.id", ondelete="SET NULL"), index=True)
    team = relationship("Team", back_populates="programs")
    reporting_period_type = Column(String(255), nullable=False)
    reporting_periods = relationship("ReportingPeriod")
    datasets = relationship("Dataset")
    # Targets only returns active targets, but keeps the relationship intact
    # for old ones.
    targets = relationship(
        "Target",
        primaryjoin="and_(Program.id == Target.program_id, Target.deleted == None)",
    )
    tags = relationship("Tag", secondary=program_tags, back_populates="programs")

    created = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)

    # Programs have to have a unique name within their respective team.
    UniqueConstraint("name", "team_id")

    @classmethod
    def get_not_deleted(cls, session, id_):
        return (
            session.query(Program)
            .options(
                selectinload(Program.datasets),
                with_loader_criteria(Dataset, Dataset.deleted == None),
            )
            .filter(Program.id == id_, Program.deleted == None)
            .scalar()
        )

    def user_is_team_member(self, user):
        return self.team.user_is_team_member(user)

    def soft_delete(self, session):
        self.deleted = func.now()
        session.add(self)
        datasets = session.query(Dataset).filter(Dataset.program_id == self.id).all()
        for dataset in datasets:
            dataset.soft_delete(session)
        session.query(Target).filter(Target.program_id == self.id).update(
            {"deleted": func.now()}, synchronize_session="fetch"
        )


class Tag(Base):
    __tablename__ = "tag"

    @classmethod
    def get_or_create(cls, session, tag_dict) -> "Tag":
        """Upsert partially-specified tags.

        :param session: Database session
        :param tag_dict: Partially specified tag input
        :returns: Tag object that might be novel
        """
        if "id" in tag_dict:
            tag_dict["id"] = uuid.UUID(tag_dict["id"])
        else:
            # If the tag exists, avoid name conflicts.
            existing_tag = cls.get_by_name(session, tag_dict["name"])
            if existing_tag:
                tag_dict = {"id": existing_tag.id}
            else:
                # Make sure defaults are set for a new tag
                if "tag_type" not in tag_dict:
                    tag_dict["tag_type"] = "custom"
                if "description" not in tag_dict:
                    tag_dict["description"] = ""

        return session.merge(cls(**tag_dict))

    @classmethod
    def get_by_name(cls, session, name):
        return session.query(cls).filter(cls.name == cls.clean_name(name)).first()

    @classmethod
    def clean_name(cls, name):
        return name.strip()

    @validates("name")
    def clean_tag_name(self, key, name):
        # NOTE: `self.__class__` basically just means `Category` here. It's slightly
        # better to avoid referencing the class explicitly by name in case a) we change
        # the name of the class, or b) we extend the class and want to allow the child
        # to override the method.
        return self.__class__.clean_name(name)

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=False)
    tag_type = Column(String(255), nullable=False)
    programs = relationship("Program", secondary=program_tags, back_populates="tags")
    datasets = relationship("Dataset", secondary=dataset_tags, back_populates="tags")

    created = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)


class Target(Base, PermissionsMixin):
    __tablename__ = "target"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    program_id = Column(GUID, ForeignKey("program.id"), index=True, nullable=False)
    program = relationship("Program", back_populates="targets")
    target_date = Column(DateTime, nullable=True)
    target = Column(Float, nullable=False)
    tracks = relationship("Track")

    category_id = Column(GUID, ForeignKey("category.id"), index=True, nullable=False)
    category = relationship("Category", back_populates="targets")

    created = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)

    def user_is_team_member(self, user):
        return self.program.user_is_team_member(user)

    @classmethod
    def get_by_programme_category(self, session, prog_id, category_id):
        return (
            session.query(self)
            .filter(self.category_id == category_id, self.program_id == prog_id)
            .first()
        )

    @classmethod
    def get_or_create(self, session, prog_id, target_dict, category_id) -> "Target":
        if "id" in target_dict:
            target_dict["id"] = uuid.UUID(target_dict["id"])
        else:
            existing_target = self.get_by_programme_category(
                session, prog_id, category_id
            )
            if existing_target:
                target_dict = {"id": existing_target.id}

        return session.merge(self(**target_dict))


class Track(Base, PermissionsMixin):
    __tablename__ = "track"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    target_id = Column(GUID, ForeignKey("target.id"), index=True)
    target = relationship("Target", back_populates="tracks")
    category_value_id = Column(GUID, ForeignKey("category_value.id"), index=True)
    category_value = relationship("CategoryValue")

    target_member = Column(Boolean, nullable=False)

    created = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)

    def user_is_team_member(self, user):
        return self.program.user_is_team_member(user)

    @classmethod
    def get_by_target_category_value(self, session, target_id, category_value_id):
        return (
            session.query(self)
            .filter(
                self.category_value_id == category_value_id, self.target_id == target_id
            )
            .first()
        )

    @classmethod
    def get_or_create(self, session, target_id, category_id, track_dict) -> "Track":
        if "id" in track_dict:
            track_dict["id"] = uuid.UUID(track_dict["id"])
        else:
            existing_target = self.get_by_target_category_value(
                session, target_id, category_id
            )
            if existing_target:
                track_dict = {"id": existing_target.id}

        return session.merge(self(**track_dict))


class Category(Base):
    __tablename__ = "category"
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category_values = relationship("CategoryValue", back_populates="category")
    targets = relationship("Target", back_populates="category")

    created = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)

    @classmethod
    def get_by_name(cls, session, name):
        return session.query(cls).filter(cls.name == cls.clean_name(name)).first()

    @classmethod
    def clean_name(cls, name):
        return name.strip()

    @classmethod
    def get_not_deleted(cls, session, id_):
        return (
            session.query(Category)
            .filter(Category.id == id_, Category.deleted == None)
            .scalar()
        )

    @classmethod
    def get_or_create(cls, session, spec):
        """Idempotently create the category value.

        :session: Database session
        :spec: Dict containing category parameters
        :returns: Category object
        """
        if "id" in spec:
            spec = {
                "id": uuid.UUID(spec["id"]),
            }
        else:
            # Ensure that if the value exists it is not duplicated
            existing = cls.get_by_name(session, spec["name"])
            if existing:
                return existing
            else:
                spec = {
                    "name": spec["name"],
                }

        return session.merge(cls(**spec))

    @validates("name")
    def capitalize_category(self, key, name):
        # NOTE: `self.__class__` basically just means `Category` here. It's slightly
        # better to avoid referencing the class explicitly by name in case a) we change
        # the name of the class, or b) we extend the class and want to allow the child
        # to override the method.
        return self.__class__.clean_name(name)

    def soft_delete(self, session):
        self.deleted = func.now()
        session.add(self)
        session.query(CategoryValue).filter(
            CategoryValue.category_id == self.id
        ).update({"deleted": func.now()}, synchronize_session="fetch")


class CategoryValue(Base):
    __tablename__ = "category_value"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    category = relationship("Category", back_populates="category_values")
    category_id = Column(GUID, ForeignKey("category.id"), index=True)
    tracks = relationship("Track", back_populates="category_value")
    entries = relationship("Entry", back_populates="category_value")

    UniqueConstraint("category_id", "name")

    created = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)

    @validates("name")
    def capitalize_name(self, key, name):
        return self.clean_name(name)

    @classmethod
    def clean_name(cls, name):
        """Normalize the category value name

        :param name: string
        :returns: Normalized string
        """
        return name.strip()

    @classmethod
    def get_or_create(cls, session, spec):
        """Idempotently create the category value.

        :session: Database session
        :spec: Dict containing category value parameters
        :returns: CategoryValue object
        """
        if "id" in spec:
            spec = {
                "id": uuid.UUID(spec["id"]),
            }
        else:
            # Ensure that if the value exists it is not duplicated
            existing = cls.get_by_name(session, spec["name"])
            if existing:
                return existing
            else:
                spec = {
                    "id": None,
                    "name": spec["name"],
                    "category_id": spec["category"]["id"],
                }
        return session.merge(cls(**spec))

    @classmethod
    def get_by_name(cls, session, name):
        """Get a category value given its name.

        Normalizes the name for the query.

        :param session: Database session
        :param name: String name
        :returns: CategoryValue if found, or None
        """
        return session.query(cls).filter(cls.name == cls.clean_name(name)).first()

    @classmethod
    def get_not_deleted(cls, session, id):
        return (
            session.query(CategoryValue)
            .filter(CategoryValue.id == id, CategoryValue.deleted == None)
            .first()
        )

    @classmethod
    def get_not_deleted(cls, session, id_):
        return (
            session.query(CategoryValue)
            .filter(CategoryValue.id == id_, CategoryValue.deleted == None)
            .scalar()
        )

    def soft_delete(self, session):
        self.deleted = func.now()
        session.add(self)
        entries = session.query(Entry).filter(Entry.category_value_id == self.id).all()
        for entry in entries:
            entry.soft_delete(session)
        session.query(Target).filter(Target.program_id == self.id).update(
            {"deleted": func.now()}, synchronize_session="fetch"
        )


class DatasetCustomColumn(Base):
    __tablename__ = "dataset_custom_column"

    id = Column(GUID, primary_key=True, index=True, default=uuid.uuid4)
    dataset_id = Column(GUID, ForeignKey("dataset.id"), index=True)
    custom_column_id = Column(GUID, ForeignKey("custom_column.id"), index=True)


class Dataset(Base, PermissionsMixin):
    __tablename__ = "dataset"

    id = Column(GUID, primary_key=True, index=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=False)
    program = relationship("Program", back_populates="datasets")
    program_id = Column(GUID, ForeignKey("program.id"), index=True)
    records = relationship("Record")
    published_record_sets = relationship("PublishedRecordSet")
    tags = relationship("Tag", secondary=dataset_tags, back_populates="datasets")
    custom_columns = relationship(
        "CustomColumn",
        back_populates="datasets",
        secondary="dataset_custom_column",
    )
    person_types = relationship(
        "PersonType",
        secondary=dataset_person_types,
        back_populates="datasets",
        order_by="PersonType.person_type_name",
    )

    # Datasets must be unique within a program to avoid ambiguity.
    UniqueConstraint("name", "program_id")

    created = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)

    @classmethod
    def get_not_deleted(cls, session, id_):
        return (
            session.query(Dataset)
            .options(
                selectinload(Dataset.records),
                with_loader_criteria(Record, Record.deleted == None),
            )
            .filter(Dataset.id == id_, Dataset.deleted == None)
            .scalar()
        )

    def user_is_team_member(self, user):
        return self.program.user_is_team_member(user)

    def soft_delete(self, session):
        self.deleted = func.now()
        session.add(self)
        records = session.query(Record).filter(Record.dataset_id == self.id).all()
        for record in records:
            record.soft_delete(session)

    @classmethod
    def upsert_datasets(cls, session, dataset_dicts):
        """Merge dataset dictionaries into dataset objects.

        :param session: Database session
        :param dataset_dicts: List of dictionaries describing datasets
        :returns: List of Dataset database objects
        """
        datasets = []
        for ds_dict in dataset_dicts:
            if "id" in ds_dict:
                ds_dict["id"] = uuid.UUID(ds_dict["id"])
            person_types = ds_dict.pop("person_types", None)
            custom_columns = ds_dict.pop("custom_columns", None)
            ds = session.merge(Dataset(**ds_dict))
            if person_types is not None:
                ds.person_types = [
                    PersonType.get_or_create(session, pt) for pt in person_types
                ]
            if custom_columns is not None:
                ds.custom_columns = [
                    CustomColumn.get_or_create(session, cc) for cc in custom_columns
                ]
            datasets.append(ds)
        return datasets


class CustomColumn(Base, PermissionsMixin):
    __tablename__ = "custom_column"
    id = Column(GUID, primary_key=True, index=True, default=uuid.uuid4)
    datasets = relationship(
        "Dataset",
        back_populates="custom_columns",
        secondary="dataset_custom_column",
    )
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    description = Column(String)

    @classmethod
    def clean_name(cls, name):
        return name.strip()

    @classmethod
    def get_or_create(cls, session, custom_column: str) -> "CustomColumn":
        cc = (
            session.query(cls)
            .filter(func.lower(cls.clean_name(custom_column)) == func.lower(cls.name))
            .first()
        )
        if cc:
            return cc

        return cls(name=custom_column, type="string")


class CustomColumnValue(Base, PermissionsMixin):
    __tablename__ = "custom_column_value"
    id = Column(GUID, primary_key=True, index=True, default=uuid.uuid4)

    record = relationship("Record", back_populates="custom_column_values")
    record_id = Column(GUID, ForeignKey("record.id"), index=True)

    custom_column = relationship("CustomColumn")
    custom_column_id = Column(GUID, ForeignKey("custom_column.id"), index=True)

    inputter = relationship("User")
    inputter_id = Column(GUID, ForeignKey("user.id"), index=True)

    value = Column(String, nullable=True)


class ReportingPeriod(Base, PermissionsMixin):
    __tablename__ = "reporting_period"

    id = Column(GUID, primary_key=True, index=True, default=uuid.uuid4)

    program = relationship("Program", back_populates="reporting_periods")
    program_id = Column(GUID, ForeignKey("program.id"), index=True)

    published_record_set = relationship(
        "PublishedRecordSet", back_populates="reporting_period", uselist=False
    )

    begin = Column(DateTime, nullable=False)
    end = Column(DateTime, nullable=False)
    description = Column(String)

    @property
    def range(self):
        return [self.begin, self.end]

    @classmethod
    def get_or_create(cls, session, spec):

        if "id" in spec:
            spec = {
                "id": uuid.UUID(spec["id"]),
            }
        else:
            # Ensure that if the value exists it is not duplicated
            existing = cls.get_by_name(session, spec["name"])
            if existing:
                return existing
            else:
                spec = {
                    "id": None,
                    "name": spec["name"],
                    "category_id": spec["category"]["id"],
                }
        return session.merge(cls(**spec))


class Record(Base, PermissionsMixin):
    __tablename__ = "record"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    dataset = relationship("Dataset", back_populates="records")
    dataset_id = Column(GUID, ForeignKey("dataset.id"), nullable=False, index=True)
    publication_date = Column(DateTime, index=True)
    custom_column_values = relationship("CustomColumnValue")

    entries = relationship("Entry", back_populates="record")
    __table_args__ = (
        UniqueConstraint(
            "dataset_id", "publication_date", name="uix_dataset_id_publication_date"
        ),
    )

    created = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)

    @classmethod
    def get_not_deleted(cls, session, id_):
        return (
            session.query(Record)
            .filter(Record.id == id_, Record.deleted == None)
            .scalar()
        )

    def user_is_team_member(self, user):
        return self.dataset.user_is_team_member(user)

    def soft_delete(self, session):
        self.deleted = func.now()
        session.add(self)
        entries = session.query(Entry).filter(Entry.record_id == self.id).all()
        for entry in entries:
            entry.soft_delete(session)


class Entry(Base, PermissionsMixin):
    __tablename__ = "entry"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)

    category_value_id = Column(GUID, ForeignKey("category_value.id"), index=True)
    category_value = relationship("CategoryValue", back_populates="entries")

    record = relationship("Record", back_populates="entries")
    record_id = Column(GUID, ForeignKey("record.id", ondelete="cascade"), index=True)

    inputter = relationship("User")
    inputter_id = Column(GUID, ForeignKey("user.id"), index=True)

    person_type = relationship("PersonType", back_populates="entries")
    person_type_id = Column(GUID, ForeignKey("person_type.id"), index=True)

    count = Column(Integer, nullable=False)

    created = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)

    @classmethod
    def get_not_deleted(cls, session, id_):
        return (
            session.query(Entry).filter(Entry.id == id_, Entry.deleted == None).scalar()
        )

    def user_is_team_member(self, user):
        return self.record.user_is_team_member(user)

    def soft_delete(self, session):
        self.deleted = func.now()
        session.add(self)


class PersonType(Base, PermissionsMixin):
    __tablename__ = "person_type"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    person_type_name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    datasets = relationship(
        "Dataset", secondary=dataset_person_types, back_populates="person_types"
    )
    entries = relationship("Entry", back_populates="person_type")

    created = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)

    @validates("person_type_name")
    def validate_name(self, key, name):
        return self.clean_name(name)

    @classmethod
    def clean_name(cls, name):
        """Normalize the person type name

        :param name: string
        :returns: Normalized string
        """
        return name.strip()

    @classmethod
    def get_or_create(cls, session, person_type: str) -> "PersonType":
        """Create a person type if it doesn't exist and return it.

        :param session: Database session
        :param person_type: String representing the person type
        :returns: The PersonType record
        """
        pt = (
            session.query(cls)
            .filter(
                func.lower(cls.clean_name(person_type))
                == func.lower(cls.person_type_name)
            )
            .first()
        )
        if pt:
            return pt

        return cls(person_type_name=person_type)


class PublishedRecordSet(Base, PermissionsMixin):
    __tablename__ = "published_record_set"

    id = Column(GUID, primary_key=True, index=True, default=uuid.uuid4)

    begin = Column(DateTime, nullable=False)
    end = Column(DateTime, nullable=False)

    document = Column(MutableDict.as_mutable(JSONB))

    reporting_period = relationship("ReportingPeriod")
    reporting_period_id = Column(
        GUID, ForeignKey("reporting_period.id"), index=True, nullable=False
    )

    __table_args__ = (UniqueConstraint("reporting_period_id"),)

    dataset = relationship("Dataset", back_populates="published_record_sets")
    dataset_id = Column(GUID, ForeignKey("dataset.id"), index=True, nullable=False)

    created = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)

    def soft_delete(self, session):
        self.deleted = func.now()

    @classmethod
    def get_not_deleted(cls, session, id_):
        return (
            session.query(PublishedRecordSet)
            .filter(PublishedRecordSet.id == id_, PublishedRecordSet.deleted == None)
            .scalar()
        )


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
