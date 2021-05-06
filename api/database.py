"""Define and manage database schema.

Run this as a script to create the database tables:
    python database.py --tables

Can also add dummy data for development with:
    python database.py --tables --dummy-data
"""
import databases
import uuid

import click
from sqlalchemy import create_engine, Table, Boolean, Column, Integer, Float, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine, event
from sqlalchemy.sql import func
from sqlalchemy.sql.expression import text
from sqlalchemy.sql.sqltypes import TIMESTAMP
from fastapi_users.db.sqlalchemy import GUID
from fastapi_users.db import SQLAlchemyBaseUserTable

from settings import settings


DATABASE_URL = f"{settings.db_user}:{settings.db_pw}@{settings.db_host}/{settings.db_name}"
database = databases.Database("postgres://" + DATABASE_URL)

engine = create_engine('postgresql+psycopg2://' + DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Handling Many-to-Many Relationships
user_teams = Table('user_team', Base.metadata,
                   Column('user_id', GUID, ForeignKey(
                       'user.id'), index=True),
                   Column('team_id', GUID, ForeignKey(
                       'team.id'), index=True),
                   )

user_roles = Table('user_role', Base.metadata,
                   Column('user_id', GUID, ForeignKey(
                       'user.id'), index=True),
                   Column('role_id', GUID, ForeignKey(
                       'role.id'), index=True),
                   )

dataset_tags = Table('dataset_tag', Base.metadata,
                     Column('dataset_id', GUID, ForeignKey(
                         'dataset.id'), index=True),
                     Column('tag_id', GUID, ForeignKey(
                         'tag.id'), index=True),
                     )

program_tags = Table('program_tag', Base.metadata,
                     Column('program_id', GUID, ForeignKey(
                         'program.id'), index=True),
                     Column('tag_id', GUID, ForeignKey(
                         'tag.id'), index=True),
                     )

class Organization(Base):
    __tablename__ = 'organization'

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    teams = relationship('Team')

    created = Column(TIMESTAMP,
                     server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP,
                     server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)


class Team(Base):
    __tablename__ = 'team'

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    users = relationship('User', secondary=user_teams, backref='Team')
    programs = relationship('Program')
    organization_id = Column(GUID, ForeignKey(
        'organization.id'), nullable=False, index=True)

    created = Column(TIMESTAMP,
                     server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP,
                     server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)


class User(Base, SQLAlchemyBaseUserTable):
    __tablename__ = 'user'

    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    roles = relationship('Role', secondary=user_roles, backref='User')
    teams = relationship('Team', secondary=user_teams, backref='User')

    created = Column(TIMESTAMP,
                     server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP,
                     server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)

    @classmethod
    def get_full_name(user):
        return f"{user.first_name} {user.last_name}"


class Role(Base):
    __tablename__ = 'role'

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=False)

    created = Column(TIMESTAMP,
                     server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP,
                     server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)

class Program(Base):
    __tablename__ = 'program'

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=False)
    team_id = Column(GUID, ForeignKey('team.id'), index=True)
    datasets = relationship('Dataset')
    targets = relationship('Target')
    tags = relationship('Tag', secondary=program_tags,
                        back_populates='programs')

    created = Column(TIMESTAMP,
                     server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP,
                     server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)


class Tag(Base):
    __tablename__ = 'tag'

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=False)
    tag_type = Column(String(255), nullable=False)
    programs = relationship('Program', secondary=program_tags,
                            back_populates='tags')
    datasets = relationship('Dataset', secondary=dataset_tags,
                            back_populates='tags')

    created = Column(TIMESTAMP,
                     server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP,
                     server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)

@event.listens_for(Tag, 'before_insert')
def capitalize_tag_name(mapper, connect, target):
    # target is an instance of Table
    target.name = target.name.capitalize().strip()

class Target(Base):
    __tablename__ = 'target'

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    program_id = Column(GUID, ForeignKey('program.id'), index=True)
    category = Column(String(255), nullable=False)
    category_value = Column(String(255), nullable=False)
    target = Column(Float, nullable=False)

    created = Column(TIMESTAMP,
                     server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP,
                     server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)


class Dataset(Base):
    __tablename__ = 'dataset'

    id = Column(GUID, primary_key=True, index=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=False)
    program_id = Column(GUID, ForeignKey('program.id'), index=True)
    records = relationship('Record')
    inputter = relationship('User')
    inputter_id = Column(GUID, ForeignKey('user.id'), index=True)

    tags = relationship('Tag', secondary=dataset_tags,
                        back_populates='datasets')

    created = Column(TIMESTAMP,
                     server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP,
                     server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)


class Record(Base):
    __tablename__ = 'record'

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    dataset = relationship('Dataset', back_populates='records')
    dataset_id = Column(GUID, ForeignKey(
        'dataset.id'), nullable=False, index=True)
    publication_date = Column(DateTime, index=True)
    entries = relationship('Entry', back_populates='record')
    __table_args__ = (UniqueConstraint('dataset_id', 'publication_date', name='uix_dataset_id_publication_date'),
                     )

    created = Column(TIMESTAMP,
                     server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP,
                     server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)


class Entry(Base):
    __tablename__ = 'entry'

    id = Column(GUID, primary_key=True, default=uuid.uuid4)

    category = Column(String(255), nullable=False)
    category_value = Column(String(255), nullable=False)
    count = Column(Integer, nullable=False)
    record = relationship('Record', back_populates='entries')
    record_id = Column(GUID, ForeignKey('record.id', ondelete="cascade"), index=True)

    created = Column(TIMESTAMP,
                     server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP,
                     server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)


def create_tables(engine, session):
    print("🍽  Creating tables ...")
    Base.metadata.create_all(engine)

    session.add(Role(
        id="be5f8cac-ac65-4f75-8052-8d1b5d40dffe",
        name="admin",
        description="User is an admin and has administrative privileges"))
    session.commit()


def create_dummy_data(session):
    print("👩🏽‍💻 Adding dummy data ...")
    org = Organization(name='BBC')

    team = Team(name='News Team')
    org.teams.append(team)

    user = User(id='cd7e6d44-4b4d-4d7a-8a67-31efffe53e77',
            email='tester@notrealemail.info',
            hashed_password='c053ecf9ed41df0311b9df13cc6c3b6078d2d3c2',
            first_name='Cat', last_name='Berry')
    team.users.append(user)

    program = Program(name='BBC News',
            description='All BBC news programming')
    team.programs.append(program)

    ds1 = Dataset(name='Breakfast Hour',
            description='breakfast hour programming')
    ds2 = Dataset(name='12PM - 4PM', description='afternoon programming')
    program.datasets.append(ds1)
    program.datasets.append(ds2)

    tag = Tag(name='news', description='tag for all news programming',
            tag_type='news')
    tag.programs.append(program)
    tag.datasets.append(ds1)
    tag.datasets.append(ds2)

    session.add(org)
    session.commit()


@click.command()
@click.option("--tables/--no-tables", default=True)
@click.option("--dummy-data/--no-dummy-data", default=False)
def run(tables: bool, dummy_data: bool):
    """Create tables and dummy data (if requested)."""
    engine = create_engine('postgresql+psycopg2://' + DATABASE_URL)
    session = SessionLocal()

    if tables:
        create_tables(engine, session)
    if dummy_data:
        create_dummy_data(session)
    print("✅ done!")


if __name__ == '__main__':
    run()
