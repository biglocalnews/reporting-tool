from sqlalchemy import create_engine, Table, Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine

Base = declarative_base()

class Organization(Base):
    __tablename__ = 'organization'

    id = Column(Integer, primary_key=True)
    name = Column(String(255))
    teams = relationship('Team')

    created = Column(DateTime, nullable=False)
    updated = Column(DateTime)
    deleted = Column(DateTime)


class Team(Base):
    __tablename__ = 'team'

    id = Column(Integer, primary_key=True)
    name = Column(String(255))
    users = relationship('User')
    programs = relationship('Program')
    organization_id = Column(Integer, ForeignKey('organization.id'), nullable=False)

    created = Column(DateTime, nullable=False)
    updated = Column(DateTime)
    deleted = Column(DateTime)


user_roles = Table('user_role', Base.metadata,
        Column('user_id', Integer, ForeignKey('user.id')),
        Column('role_id', Integer, ForeignKey('role.id')),
        )


class User(Base):
    __tablename__ = 'user'

    id = Column(Integer, primary_key=True)
    email = Column(String(255), nullable=False)
    password = Column(String(255), nullable=False)
    team_id = Column(Integer, ForeignKey('team.id'))
    roles = relationship('UserRole', secondary=user_roles)

    created = Column(DateTime, nullable=False)
    updated = Column(DateTime)
    deleted = Column(DateTime)
    

class Role(Base):
    __tablename__ = 'role'

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable = False)
    description = Column(String(255), nullable = False)

    created = Column(DateTime, nullable=False)
    updated = Column(DateTime)
    deleted = Column(DateTime)


dataset_tags = Table('dataset_tag', Base.metadata,
        Column('dataset_id', Integer, ForeignKey('dataset.id')),
        Column('tag_id', Integer, ForeignKey('tag.id')),
        )


program_tags = Table('program_tag', Base.metadata,
        Column('program_id', Integer, ForeignKey('program.id')),
        Column('tag_id', Integer, ForeignKey('tag.id')),
        )


class Program(Base):
    __tablename__ = 'program'

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=False)
    team_id = Column(Integer, ForeignKey('team.id'))
    datasets = relationship('Dataset')
    targets = relationship('Target')
    tags = relationship('Tag', secondary=program_tags,
            back_populates='programs')

    created = Column(DateTime, nullable=False)
    updated = Column(DateTime)
    deleted = Column(DateTime)


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
    

    created = Column(DateTime, nullable=False)
    updated = Column(DateTime)
    deleted = Column(DateTime)


class Target(Base):
    __tablename__ = 'target'

    id = Column(Integer, primary_key=True)
    program_id = Column(Integer, ForeignKey('program.id'))
    category = Column(String(255), nullable=False)
    category_value = Column(String(255), nullable=False)
    target = Column(Float, nullable=False)

    created = Column(DateTime, nullable=False)
    updated = Column(DateTime)
    deleted = Column(DateTime)


class Dataset(Base):
    __tablename__ = 'dataset'

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=False)
    program_id = Column(Integer, ForeignKey('program.id'))
    records = relationship('Record')
    inputter = relationship('User')
    inputter_id = Column(Integer, ForeignKey('user.id'))

    tags = relationship('Tag', secondary=dataset_tags,
            back_populates='datasets')

    created = Column(DateTime, nullable=False)
    updated = Column(DateTime)
    deleted = Column(DateTime)


class Record(Base):
    __tablename__ = 'record'

    id = Column(Integer, primary_key=True)
    dataset_id = Column(Integer, ForeignKey('dataset.id'), nullable=False)
    publication_date = Column(DateTime)
    category = Column(String(255), nullable=False)
    category_value = Column(String(255), nullable=False)
    count = Column(Integer, nullable=False)

    created = Column(DateTime, nullable=False)
    updated = Column(DateTime)
    deleted = Column(DateTime)

if __name__ == '__main__':
    engine = create_engine('postgresql+psycopg2://postgres:pass@localhost/bbc')

    Base.metadata.create_all(engine)
