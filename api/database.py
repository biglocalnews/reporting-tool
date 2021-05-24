"""Define and manage database schema.

Run this as a script to create the database tables:
    python database.py --tables

Can also add dummy data for development with:
    python database.py --tables --dummy-data
"""
import databases
import uuid

import click
from datetime import datetime
from sqlalchemy import create_engine, Table, Boolean, Column, Integer, Float, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, sessionmaker, validates
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

    @validates('name')
    def capitalize_tag_name(self, key, name):
        return name.capitalize().strip()

class Target(Base):
    __tablename__ = 'target'

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    program_id = Column(GUID, ForeignKey('program.id'), index=True)
    target_date = Column(DateTime, nullable=False)
    target = Column(Float, nullable=False)
    category_id = Column(GUID, ForeignKey('category.id'), index=True)
    category = relationship('Category', back_populates='targets')

    created = Column(TIMESTAMP,
                     server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP,
                     server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)

class Category(Base):
    __tablename__ = 'category'

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    description = Column(String(255), nullable=False)
    category = Column(String(255), nullable=False)
    category_value = Column(String(255), nullable=False)

    targets = relationship('Target')

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
    program = relationship('Program', back_populates='datasets')
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

    category_id = Column(GUID, ForeignKey('category.id'), index=True)
    category = relationship('Category')
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

    program = Program(id="1e73e788-0808-4ee8-9b25-682b6fa3868b", name='BBC News',
            description='All BBC news programming')
    team.programs.append(program)

    ds1 = Dataset(id='b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89', name='Breakfast Hour',
            description='breakfast hour programming', inputter_id='cd7e6d44-4b4d-4d7a-8a67-31efffe53e77')
    ds2 = Dataset(id='96336531-9245-405f-bd28-5b4b12ea3798', name='12PM - 4PM', description='afternoon programming', inputter_id='cd7e6d44-4b4d-4d7a-8a67-31efffe53e77')
    program.datasets.append(ds1)
    program.datasets.append(ds2)

    tag = Tag(id='4a2142c0-5416-431d-b62f-0dbfe7574688', name='news', description='tag for all news programming',
            tag_type='news')
    tag.programs.append(program)
    tag.datasets.append(ds1)
    tag.datasets.append(ds2)

    category_non_binary = Category(id='51349e29-290e-4398-a401-5bf7d04af75e', description='Non-binary gender',
                                    category='gender', category_value='non-binary')
    category_cis_women = Category(id='0034d015-0652-497d-ab4a-d42b0bdf08cb', description='Cisgender women gender',
                                    category='gender', category_value='cisgender women')
    category_cis_men = Category(id='d237a422-5858-459c-bd01-a0abdc077e5b', description='Cisgender men gender',
                                    category='gender', category_value='cisgender men')
    category_trans_women = Category(id='662557e5-aca8-4cec-ad72-119ad9cda81b', description='Transgender women gender',
                                    category='gender', category_value='trans women')   
    category_trans_men = Category(id='1525cce8-7db3-4e73-b5b0-d2bd14777534', description='Transgender men gender',
                                    category='gender', category_value='trans men')   
    category_gender_non_conforming = Category(id='a72ced2b-b1a6-4d3d-b003-e35e980960df', description='Gender non-conforming gender',
                                    category='gender', category_value='gender non-conforming')

    target_non_binary = Target(id='40eaeafc-3311-4294-a639-a826eb6495ab', program_id='1e73e788-0808-4ee8-9b25-682b6fa3868b', category_id='51349e29-290e-4398-a401-5bf7d04af75e', target_date=datetime.strptime('2022-12-31 00:00:00', '%Y-%m-%d %H:%M:%S'), target=float(.16666666666))
    target_cis_women = Target(id='eccf90e8-3261-46c1-acd5-507f9113ff72', program_id='1e73e788-0808-4ee8-9b25-682b6fa3868b', category_id='0034d015-0652-497d-ab4a-d42b0bdf08cb', target_date=datetime.strptime('2022-12-31 00:00:00', '%Y-%m-%d %H:%M:%S'), target=float(.16666666666))
    target_cis_men = Target(id='2d501688-92e3-455e-9685-01141de3dbaf', program_id='1e73e788-0808-4ee8-9b25-682b6fa3868b', category_id='d237a422-5858-459c-bd01-a0abdc077e5b', target_date=datetime.strptime('2022-12-31 00:00:00', '%Y-%m-%d %H:%M:%S'), target=float(.16666666666))
    target_trans_women = Target(id='4f7897c2-32a1-4b1e-9749-1a8066faca01', program_id='1e73e788-0808-4ee8-9b25-682b6fa3868b', category_id='662557e5-aca8-4cec-ad72-119ad9cda81b', target_date=datetime.strptime('2022-12-31 00:00:00', '%Y-%m-%d %H:%M:%S'), target=float(.16666666666))
    target_trans_men = Target(id='9352b16b-2607-4f7d-a272-fe6dedd8165a', program_id='1e73e788-0808-4ee8-9b25-682b6fa3868b', category_id='1525cce8-7db3-4e73-b5b0-d2bd14777534', target_date=datetime.strptime('2022-12-31 00:00:00', '%Y-%m-%d %H:%M:%S'), target=float(.16666666666))
    target_gender_non_conforming = Target(id='a459ed7f-5573-4d5b-ade6-3070bc8bd2db', program_id='1e73e788-0808-4ee8-9b25-682b6fa3868b', category_id='a72ced2b-b1a6-4d3d-b003-e35e980960df', target_date=datetime.strptime('2022-12-31 00:00:00', '%Y-%m-%d %H:%M:%S'), target=float(.16666666666))
          
    category_non_binary.targets.append(target_non_binary)
    category_cis_women.targets.append(target_cis_women)
    category_cis_men.targets.append(target_cis_men)
    category_trans_women.targets.append(target_trans_women)
    category_trans_men.targets.append(target_trans_men)
    category_gender_non_conforming.targets.append(target_gender_non_conforming)

    session.add(category_non_binary)
    session.add(category_cis_women)
    session.add(category_cis_men)
    session.add(category_trans_women)
    session.add(category_trans_men)
    session.add(category_gender_non_conforming)

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
