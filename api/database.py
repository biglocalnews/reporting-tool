import databases
import uuid

from sqlalchemy import create_engine, Table, Boolean, Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
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


class Organization(Base):
    __tablename__ = 'organization'

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    teams = relationship('Team')

    created = Column(TIMESTAMP,
                     server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP,
                     server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)


class Team(Base):
    __tablename__ = 'team'

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    users = relationship('User')
    programs = relationship('Program')
    organization_id = Column(Integer, ForeignKey(
        'organization.id'), nullable=False, index=True)

    created = Column(TIMESTAMP,
                     server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP,
                     server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)


user_roles = Table('user_role', Base.metadata,
                   Column('user_id', GUID, ForeignKey(
                       'user.id'), index=True),
                   Column('role_id', Integer, ForeignKey(
                       'role.id'), index=True),
                   )


class User(Base, SQLAlchemyBaseUserTable):
    __tablename__ = 'user'

    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    team_id = Column(Integer, ForeignKey('team.id'), index=True)
    roles = relationship('Role', secondary=user_roles, backref='User')

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

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=False)

    created = Column(TIMESTAMP,
                     server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP,
                     server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)


dataset_tags = Table('dataset_tag', Base.metadata,
                     Column('dataset_id', GUID, ForeignKey(
                         'dataset.id'), index=True),
                     Column('tag_id', Integer, ForeignKey(
                         'tag.id'), index=True),
                     )


program_tags = Table('program_tag', Base.metadata,
                     Column('program_id', Integer, ForeignKey(
                         'program.id'), index=True),
                     Column('tag_id', Integer, ForeignKey(
                         'tag.id'), index=True),
                     )


class Program(Base):
    __tablename__ = 'program'

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=False)
    team_id = Column(Integer, ForeignKey('team.id'), index=True)
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

    id = Column(Integer, primary_key=True)
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


class Target(Base):
    __tablename__ = 'target'

    id = Column(Integer, primary_key=True)
    program_id = Column(Integer, ForeignKey('program.id'), index=True)
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
    program_id = Column(Integer, ForeignKey('program.id'), index=True)
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

    id = Column(GUID, primary_key=True)
    dataset_id = Column(GUID, ForeignKey(
        'dataset.id'), nullable=False, index=True)
    publication_date = Column(DateTime)
    category = Column(String(255), nullable=False)
    category_value = Column(String(255), nullable=False)
    count = Column(Integer, nullable=False)

    created = Column(TIMESTAMP,
                     server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP,
                     server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)


if __name__ == '__main__':
    engine = create_engine('postgresql+psycopg2://' + DATABASE_URL)

    Base.metadata.create_all(engine)

    session = SessionLocal()
    session.add(Role(
        name="admin", description="User is an admin and has administrative privileges"))
    session.commit()
