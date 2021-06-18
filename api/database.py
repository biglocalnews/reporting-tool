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
from sqlalchemy import create_engine, Table, Boolean, Column, Integer, Float, String, DateTime, Text, ForeignKey, UniqueConstraint
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

engine = create_engine('postgresql+psycopg2://' + DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Handling Many-to-Many Relationships
user_teams = Table('user_team', Base.metadata,
                   Column('user_id', GUID, ForeignKey(
                       'user.id'), index=True),
                   Column('team_id', GUID, ForeignKey(
                       'team.id', ondelete="CASCADE"), index=True),
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


class PermissionsMixin:
    """Base class defining some common permissions checks."""

    def user_is_team_member(self, user: "Optional[User]") -> bool:
        """Check whether a user can access an object through their team.

        :param user: User object (could be None)
        :returns: True if user's team has permission to see the object
        """
        return False


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


class Team(Base, PermissionsMixin):
    __tablename__ = 'team'

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    users = relationship('User', secondary=user_teams, backref='Team')
    programs = relationship('Program')
    organization_id = Column(GUID, ForeignKey(
        'organization.id'), nullable=False, index=True)
    organization = relationship('Organization', back_populates='teams')

    created = Column(TIMESTAMP,
                     server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP,
                     server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)

    def user_is_team_member(self, user):
        if not user:
            return False
        return self in user.teams


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

    @classmethod
    def get_by_email(cls, session: SessionLocal, email: str) -> "Optional[User]":
        """Get a user by their email address.

        :param email:
        :returns: User, if one was found
        """
        return session.query(User).filter(
                User.email == email,
                User.deleted == None,
                ).first()

    @classmethod
    def delete(cls, session: SessionLocal, id) -> None:
        """Delete a user by their ID.

        This is a soft delete; the record will stay in the database.

        :param session: Database session
        :param id: UUID of user
        """
        return session.query(User).filter(User.id == id).update({
            User.delete: func.now(),
            }, synchronize_session='fetch')


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


class Program(Base, PermissionsMixin):
    __tablename__ = 'program'

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=False)
    team_id = Column(GUID, ForeignKey('team.id', ondelete='SET NULL'), index=True)
    team = relationship('Team', back_populates='programs')
    datasets = relationship('Dataset')
    targets = relationship('Target')
    tags = relationship('Tag', secondary=program_tags,
                        back_populates='programs')

    created = Column(TIMESTAMP,
                     server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP,
                     server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)

    def user_is_team_member(self, user):
        return self.team.user_is_team_member(user)


class Tag(Base):
    __tablename__ = 'tag'
    
    @classmethod
    def get_by_name(cls, session, name):
        return session.query(cls).filter(cls.name == cls.clean_name(name)).first()
    
    @classmethod
    def clean_name(cls, name):
        return name.capitalize().strip()

    @validates('name')
    def capitalize_tag_name(self, key, name):
        # NOTE: `self.__class__` basically just means `Category` here. It's slightly
        # better to avoid referencing the class explicitly by name in case a) we change
        # the name of the class, or b) we extend the class and want to allow the child
        # to override the method.
        return self.__class__.clean_name(name)

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


class Target(Base, PermissionsMixin):
    __tablename__ = 'target'

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    program_id = Column(GUID, ForeignKey('program.id'), index=True)
    program = relationship('Program', back_populates='targets')
    target_date = Column(DateTime, nullable=False)
    target = Column(Float, nullable=False)
    category_value_id = Column(GUID, ForeignKey('category_value.id'), index=True)
    category_value = relationship('CategoryValue', back_populates='targets')

    created = Column(TIMESTAMP,
                     server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP,
                     server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)

    def user_is_team_member(self, user):
        return self.program.user_is_team_member(user)


class Category(Base):
    __tablename__ = 'category'
    @classmethod
    def get_by_name(cls, session, name):
        return session.query(cls).filter(cls.name == cls.clean_name(name)).first()
    
    @classmethod
    def clean_name(cls, name):
        return name.capitalize().strip()

    @validates('name')
    def capitalize_category(self, key, name):
        # NOTE: `self.__class__` basically just means `Category` here. It's slightly
        # better to avoid referencing the class explicitly by name in case a) we change
        # the name of the class, or b) we extend the class and want to allow the child
        # to override the method.
        return self.__class__.clean_name(name)
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category_value = relationship('CategoryValue', back_populates='category')

    created = Column(TIMESTAMP,
                     server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP,
                     server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)
    

class CategoryValue(Base):
    __tablename__ = 'category_value'

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False) 
    category = relationship('Category', back_populates='category_value')
    category_id = Column(GUID, ForeignKey('category.id'), index=True)
    targets = relationship('Target', back_populates='category_value')
    entries = relationship('Entry', back_populates='category_value')

    created = Column(TIMESTAMP,
                     server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP,
                     server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)
    
    @validates('name')
    def capitalize_name(self, key, name):
        return name.capitalize().strip()

    @classmethod
    def get_not_deleted(cls, session, id):
        return session.query(CategoryValue).\
            filter(CategoryValue.id == id, CategoryValue.deleted == None).first()
    

class Dataset(Base, PermissionsMixin):
    __tablename__ = 'dataset'

    id = Column(GUID, primary_key=True, index=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=False)
    program = relationship('Program', back_populates='datasets')
    program_id = Column(GUID, ForeignKey('program.id'), index=True)
    records = relationship('Record')
    tags = relationship('Tag', secondary=dataset_tags,
                        back_populates='datasets')

    created = Column(TIMESTAMP,
                     server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP,
                     server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)

    @classmethod
    def get_not_deleted(cls, session, id_):
        return session.query(Dataset).filter(Dataset.id == id_, Dataset.deleted == None).first()

    def user_is_team_member(self, user):
        return self.program.user_is_team_member(user)


class Record(Base, PermissionsMixin):
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

    @classmethod
    def get_not_deleted(cls, session, id_):
        return session.query(Record).filter(Record.id == id_, Record.deleted == None).first()

    def user_is_team_member(self, user):
        return self.dataset.user_is_team_member(user)


class Entry(Base, PermissionsMixin):
    __tablename__ = 'entry'

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    category_value_id = Column(GUID, ForeignKey('category_value.id'), index=True)
    category_value = relationship('CategoryValue', back_populates='entries')
    count = Column(Integer, nullable=False)
    record = relationship('Record', back_populates='entries')
    record_id = Column(GUID, ForeignKey('record.id', ondelete="cascade"), index=True)
    inputter = relationship('User')
    inputter_id = Column(GUID, ForeignKey('user.id'), index=True)

    created = Column(TIMESTAMP,
                     server_default=func.now(), nullable=False)
    updated = Column(TIMESTAMP,
                     server_default=func.now(), onupdate=func.now())
    deleted = Column(TIMESTAMP)

    def user_is_team_member(self, user):
        return self.record.user_is_team_member(user)


def create_tables(engine, session):
    print("🍽  Creating tables ...")
    Base.metadata.create_all(engine)

    session.add(Role(
        id="be5f8cac-ac65-4f75-8052-8d1b5d40dffe",
        name="admin",
        description="User is an admin and has administrative privileges"))
    session.commit()


def create_dummy_data(session):
    if not settings.debug:
        raise RuntimeError("Can't add dummy data when not in a debug environment")

    from passlib.hash import bcrypt
    def hash_test_password(pw: str) -> str:
        # NOTE: Use consistent salt and rounds to eliminate non-determinism in
        # testing. This is obviously not intended to be secure.
        return bcrypt.hash(pw, salt="0"*22, rounds=4)

    print("👩🏽‍💻 Adding dummy data ...")    
    user = User(id='cd7e6d44-4b4d-4d7a-8a67-31efffe53e77',
            email='tester@notrealemail.info',
            hashed_password=hash_test_password('password'),
            first_name='Cat', last_name='Berry')
    
    # Secondary app user (no perms, used for testing access controls)
    other_user = User(id='a47085ba-3d01-46a4-963b-9ffaeda18113',
    email='other@notrealemail.info',
    hashed_password=hash_test_password('otherpassword'),
    first_name='Penelope', last_name='Pineapple')
    session.add(other_user)
                      
    # Admin user
    admin_user = User(id='df6413b4-b910-4f6e-8f3c-8201c9e65af3',
                    email='admin@notrealemail.info',
                    hashed_password=hash_test_password('adminpassword'),
                    first_name='Daisy', last_name='Carrot')
    admin = session.query(Role).get('be5f8cac-ac65-4f75-8052-8d1b5d40dffe')
    admin_user.roles.append(admin)
    session.add(admin_user)
    
    ds1 = Dataset(id='b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89', name='Breakfast Hour',
            description='breakfast hour programming')
    ds2 = Dataset(id='96336531-9245-405f-bd28-5b4b12ea3798', name='12PM - 4PM', description='afternoon programming')
    
    program = Program(id="1e73e788-0808-4ee8-9b25-682b6fa3868b", name='BBC News',
            description='All BBC news programming', datasets=[ds1, ds2])
    
    team = Team(id="472d17da-ff8b-4743-823f-3f01ea21a349", name='News Team', users=[user], programs=[program])
    
    org = Organization(id="15d89a19-b78d-4ee8-b321-043f26bdd48a", name='BBC', teams=[team])

    Tag(id='4a2142c0-5416-431d-b62f-0dbfe7574688', name='news', description='tag for all news programming',
            tag_type='news', programs=[program], datasets=[ds1, ds2])
    
    category_gender = Category(id='51349e29-290e-4398-a401-5bf7d04af75e', name='gender', 
                               description='Gender: A social construct based on a group of emotional and psychological characteristics that classify an individual as feminine, masculine, androgynous or other. Gender can be understood to have several components, including gender identity, gender expression and gender role.')
    category_race = Category(id='2f98f223-417f-41ea-8fdb-35f0c5fe5b41', name='race', description='Race: is ...')
    category_disability = Category(id='55119215-71e9-43ca-b2c1-7e7fb8cec2fd', name='disability', description='A disability is any condition of the body or mind (impairment) that makes it more difficult for the person with the condition to do certain activities (activity limitation) and interact with the world around them (participation restrictions). Some disabilities may be hidden or not easy to see.')
    
    target_non_binary = Target(id='40eaeafc-3311-4294-a639-a826eb6495ab', program=program, target_date=datetime.strptime('2022-12-31 00:00:00', '%Y-%m-%d %H:%M:%S'), target=float(.16666666666))
    target_cis_women = Target(id='eccf90e8-3261-46c1-acd5-507f9113ff72', program=program, target_date=datetime.strptime('2022-12-31 00:00:00', '%Y-%m-%d %H:%M:%S'), target=float(.16666666666))
    target_cis_men = Target(id='2d501688-92e3-455e-9685-01141de3dbaf', program=program, target_date=datetime.strptime('2022-12-31 00:00:00', '%Y-%m-%d %H:%M:%S'), target=float(.16666666666))
    target_trans_women = Target(id='4f7897c2-32a1-4b1e-9749-1a8066faca01', program=program, target_date=datetime.strptime('2022-12-31 00:00:00', '%Y-%m-%d %H:%M:%S'), target=float(.16666666666))
    target_trans_men = Target(id='9352b16b-2607-4f7d-a272-fe6dedd8165a', program=program, target_date=datetime.strptime('2022-12-31 00:00:00', '%Y-%m-%d %H:%M:%S'), target=float(.16666666666))
    target_gender_non_conforming = Target(id='a459ed7f-5573-4d5b-ade6-3070bc8bd2db', program=program, target_date=datetime.strptime('2022-12-31 00:00:00', '%Y-%m-%d %H:%M:%S'), target=float(.16666666666))
    target_disabed = Target(id='b5be10ce-103f-41f2-b4c4-603228724993', program=program, target_date=datetime.strptime('2022-12-31 00:00:00', '%Y-%m-%d %H:%M:%S'), target=float(.50))
    target_non_disabled = Target(id='6e6edce5-3d24-4296-b929-5eec26d52afc', program=program, target_date=datetime.strptime('2022-12-31 00:00:00', '%Y-%m-%d %H:%M:%S'), target=float(.50))

    entry1 = Entry(id='64677dc1-a1cd-4cd3-965d-6565832d307a', count=1, inputter=user) 
    entry2 = Entry(id='a37a5fe2-1493-4cb9-bcd0-a87688ffa409', count=1, inputter=user) 
    entry3 = Entry(id='423dc42f-4628-40e4-b9cd-4e6e9e384d61', count=1, inputter=user) 
    entry4 = Entry(id='407f24d0-c5eb-4297-9495-90e325a00a1d', count=1, inputter=user) 
    entry5 = Entry(id='4adcb9f9-c1eb-41ba-b9aa-ed0947311a24', count=1, inputter=user) 
    entry6 = Entry(id='1c49c64f-51e6-48fe-af10-69aaeeddc55f', count=1, inputter=user) 
    entry7 = Entry(id='335b3680-13a1-4d8f-a917-01e1e7e1311a', count=1, inputter=user)
    entry8 = Entry(id='fa5f1f0e-d5ba-4f2d-bdbf-819470a6fa4a', count=1, inputter=user)
    
    CategoryValue(id='742b5971-eeb6-4f7a-8275-6111f2342bb4', name='cisgender women', category=category_gender, targets=[target_cis_women], entries=[entry2])
    CategoryValue(id='d237a422-5858-459c-bd01-a0abdc077e5b', name='cisgender men', category=category_gender, targets=[target_cis_men], entries=[entry3])
    CategoryValue(id='662557e5-aca8-4cec-ad72-119ad9cda81b', name='trans women', category=category_gender, targets=[target_trans_women], entries=[entry4])
    CategoryValue(id='1525cce8-7db3-4e73-b5b0-d2bd14777534', name='trans men', category=category_gender, targets=[target_trans_men], entries=[entry5])
    CategoryValue(id='a72ced2b-b1a6-4d3d-b003-e35e980960df', name='gender non-conforming', category=category_gender, targets=[target_gender_non_conforming], entries=[entry6])
    CategoryValue(id='6cae6d26-97e1-4e9c-b1ad-954b4110e83b', name='non-binary', category=category_gender, targets=[target_non_binary], entries=[entry1])
    CategoryValue(id='c36958cb-cc62-479e-ab61-eb03896a981c', name='disabled', category=category_disability, targets=[target_disabed], entries=[entry7])
    CategoryValue(id='55119215-71e9-43ca-b2c1-7e7fb8cec2fd', name='non-disabled', category=category_disability, targets=[target_non_disabled], entries=[entry8])
    
    category_value_white = CategoryValue(id='0034d015-0652-497d-ab4a-d42b0bdf08cb', name='white', category=category_race)
    
    # datetime.strptime converts a string to a datetime object bc of SQLite DateTime limitation- must be explicit about format
    Record(id='742b5971-eeb6-4f7a-8275-6111f2342bb4', dataset=ds1, publication_date=datetime.strptime('2020-12-21 00:00:00', '%Y-%m-%d %H:%M:%S'), 
           entries=[entry1, entry2, entry3, entry4, entry5, entry6, entry7, entry8]) 
    
    session.add(category_value_white)
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
