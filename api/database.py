# Define and manage database schema.

from email.message import EmailMessage
from typing import Optional
import uuid
from sqlalchemy import (
    Table,
    Column,
    Integer,
    Float,
    String,
    DateTime,
    Text,
    ForeignKey,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import (
    relationship,
    selectinload,
    validates,
    with_loader_criteria,
)

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableDict

from sqlalchemy.sql import func

from sqlalchemy.sql.sqltypes import TIMESTAMP, Boolean
from fastapi_users.db.sqlalchemy import GUID
from fastapi_users.db import SQLAlchemyBaseUserTable


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
                func.lower(User.email) == func.lower(email),
                User.deleted == None,
            )
            .one_or_none()
        )

    @classmethod
    def get_by_username(cls, session, username: str) -> "Optional[User]":
        return (
            session.query(User)
            .filter(
                func.lower(User.username) == func.lower(username),
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

    # in the old system a program is like a dataset in this system, but we create
    # a program for the dataset with the same name in the new system
    imported_id = Column(Integer)

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

    # in the old system tags are called groups
    imported_id = Column(Integer)

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

    # in the old system a program is like a dataset in this system, but we create
    # a program for the dataset with the same name in the new system
    imported_id = Column(Integer)

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


class SentItem(Base, PermissionsMixin):
    __tablename__ = "sent_item"

    id = Column(GUID, primary_key=True, index=True, default=uuid.uuid4)

    month_year = Column(String(255), nullable=False)

    sent_as = Column(String(255), nullable=False)

    to = Column(String(255), nullable=False)

    subject = Column(String(255), nullable=False)

    body_text = Column(String, nullable=False)

    bcc = Column(String, nullable=False)

    succeeded = Column(Boolean, nullable=False)

    errors = Column(String, nullable=True)

    created = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)

    @classmethod
    def map_message(self, email_message: EmailMessage, month_year):
        return SentItem(
            month_year=month_year,
            sent_as=email_message["From"],
            to=email_message["To"],
            subject=email_message["Subject"],
            bcc=email_message["Bcc"],
            body_text=email_message.get_body().as_string(),
        )


class Cache(Base, PermissionsMixin):
    __tablename__ = "cache"

    id = Column(String(255), primary_key=True, index=True)
    document = Column(JSONB)
