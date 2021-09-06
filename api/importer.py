import csv
from datetime import datetime
from uuid import uuid4
from database import (
    Category,
    CategoryValue,
    Dataset,
    Entry,
    Organization,
    PersonType,
    Record,
    Target,
    connection,
    Team,
    Program,
)
from settings import settings
from sqlalchemy.orm.exc import NoResultFound, MultipleResultsFound

with open("5050-data.csv", "r") as csv_file:
    session = connection()
    csv_reader = csv.reader(
        csv_file,
        quotechar='"',
        delimiter=",",
        quoting=csv.QUOTE_ALL,
        skipinitialspace=True,
    )
    next(csv_reader)
    for line in csv_reader:
        (
            RemoteID,
            ProgrammeId,
            ProgrammeName,
            GroupId,
            GroupName,
            Month,
            Year,
            MaleRatio,
            FemaleRatio,
        ) = line

        print(ProgrammeName)
        print(Year)
        print(line)

        team_id = None
        team = None

        try:
            team = session.query(Team).filter(Team.name == GroupName).one()
            team_id = team.id
        except MultipleResultsFound as e:
            print(e)
            exit(1)
        except NoResultFound as e:
            print(e)
            print("Creating new team")
            team_id = uuid4()
            team = Team(
                id=team_id,
                name=GroupName,
            )
            session.add(team)
            org = session.query(Organization).get(
                "15d89a19-b78d-4ee8-b321-043f26bdd48a"
            )
            org.teams.append(team)
            session.commit()

        session.commit()

        programme_id = None
        programme = None

        try:
            programme = (
                session.query(Program)
                .filter(Program.name == ProgrammeName and Program.team_id == team.id)
                .one()
            )
            programme_id = programme.id
        except MultipleResultsFound as e:
            print(e)
            exit(1)
        except NoResultFound as e:
            print(e)
            print("Creating new programme")
            programme_id = uuid4()
            programme = Program(id=programme_id, name=ProgrammeName, description="")
            ds1 = Dataset(
                id=uuid4(),
                name="Default",
                description="Default dataset",
            )
            session.add(ds1)
            programme.datasets.append(ds1)
            session.add(programme)
            session.commit()

        team.programs.append(programme)
        session.add(team)
        session.commit()

        category_gender = session.query(Category).get(
            "51349e29-290e-4398-a401-5bf7d04af75e"
        )

        session.commit()

        cat_cis_women = None

        try:
            cat_cis_women = (
                session.query(CategoryValue)
                .filter(CategoryValue.name == "cisgender women")
                .one()
            )
        except MultipleResultsFound as e:
            print(e)
            exit(1)
        except NoResultFound as e:
            cat_cis_women = CategoryValue(
                id=uuid4(), name="cisgender women", category=category_gender
            )
            session.add(cat_cis_women)
            session.commit()

        cat_cis_men = None

        try:
            cat_cis_men = (
                session.query(CategoryValue)
                .filter(CategoryValue.name == "cisgender men")
                .one()
            )
        except MultipleResultsFound as e:
            print(e)
            exit(1)
        except NoResultFound as e:
            cat_cis_men = CategoryValue(
                id=uuid4(), name="cisgender men", category=category_gender
            )
            session.add(cat_cis_men)
            session.commit()

        try:
            target_cis_women = (
                session.query(Target)
                .filter(
                    Target.program_id == programme.id
                    and Target.category_value_id == cat_cis_women.id
                )
                .one()
            )
        except MultipleResultsFound as e:
            print(e)
            exit(1)
        except NoResultFound as e:
            target_cis_women = Target(
                id=uuid4(),
                program=programme,
                target_date=datetime.strptime(
                    "2022-12-31 00:00:00", "%Y-%m-%d %H:%M:%S"
                ),
                target=float(0.50),
            )
            session.add(target_cis_women)
            cat_cis_women.targets.append(target_cis_women)
            session.commit()

        target_cis_men = None

        try:
            target_cis_men = (
                session.query(Target)
                .filter(
                    Target.program_id == programme.id
                    and Target.category_value_id == cat_cis_men.id
                )
                .one()
            )
        except MultipleResultsFound as e:
            print(e)
            exit(1)
        except NoResultFound as e:
            target_cis_men = Target(
                id=uuid4(),
                program=programme,
                target_date=datetime.strptime(
                    "2022-12-31 00:00:00", "%Y-%m-%d %H:%M:%S"
                ),
                target=float(0.50),
            )
            session.add(target_cis_men)
            cat_cis_men.targets.append(target_cis_men)
            session.commit()

        session.commit()

        print(Year)
        print(Month)

        record = Record(
            id=uuid4(),
            dataset=programme.datasets[0],
            publication_date=datetime.strptime(
                f"{Year}-{Month}-1 00:00:00", "%Y-%m-%d %H:%M:%S"
            ),
        )

        session.add(record)
        session.commit()

        entry1 = Entry(id=uuid4(), count=int(FemaleRatio))
        entry2 = Entry(id=uuid4(), count=int(MaleRatio))

        record.entries.append(entry1)
        record.entries.append(entry2)
        session.commit()

        ptype = PersonType(
            id=uuid4(),
            person_type_name="BBC Contributor",
            datasets=[programme.datasets[0]],
        )

        session.add(ptype)
        session.commit()

        ptype.entries.append(entry1)
        ptype.entries.append(entry2)
        session.commit()

        print(ProgrammeName)
