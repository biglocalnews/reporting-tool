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
    Tag,
    Target,
    connection,
    Team,
    Program,
)
from settings import settings
from sqlalchemy.orm.exc import NoResultFound, MultipleResultsFound

with open("5050-data.csv", "r") as csv_file:
    session = connection()
    bbc_org = session.query(Organization).get("15d89a19-b78d-4ee8-b321-043f26bdd48a")
    team = None
    team_name = "Unassigned"

    try:
        team = session.query(Team).filter(Team.name == team_name).one()
    except MultipleResultsFound as e:
        print(e)
        exit(1)
    except NoResultFound as e:
        print(e)
        print("Creating new team")
        team = Team(id=uuid4(), name=team_name, organization=bbc_org)
        session.add(team)

    programme = None
    programme_name = "Unassigned"

    try:
        programme = (
            session.query(Program)
            .filter(Program.name == programme_name, Program.team_id == team.id)
            .one()
        )
    except MultipleResultsFound as e:
        print(e)
        exit(1)
    except NoResultFound as e:
        print(e)
        print("Creating new programme")
        programme = Program(id=uuid4(), name=programme_name, description="", team=team)
        session.add(programme)

    category_gender = session.query(Category).get(
        "51349e29-290e-4398-a401-5bf7d04af75e"
    )

    cat_value_cis_women = None

    try:
        cat_value_cis_women = (
            session.query(CategoryValue).filter(CategoryValue.name == "Women").one()
        )
    except MultipleResultsFound as e:
        print(e)
        exit(1)
    except NoResultFound as e:
        print("Creating new cat_value_cis_women")
        cat_value_cis_women = CategoryValue(
            id=uuid4(), name="women", category=category_gender
        )
        session.add(cat_value_cis_women)
        print(cat_value_cis_women)

    cat_value_cis_men = None

    try:
        cat_value_cis_men = (
            session.query(CategoryValue).filter(CategoryValue.name == "Men").one()
        )
    except MultipleResultsFound as e:
        print(e)
        exit(1)
    except NoResultFound as e:
        print("Creating new cat_value_cis_men")
        cat_value_cis_men = CategoryValue(
            id=uuid4(), name="men", category=category_gender
        )
        session.add(cat_value_cis_men)
        print(cat_value_cis_men)

    target_cis_women = None

    try:
        target_cis_women = (
            session.query(Target)
            .filter(
                Target.program_id == programme.id,
                Target.category_value_id == cat_value_cis_women.id,
            )
            .one()
        )
    except MultipleResultsFound as e:
        print(e)
        exit(1)
    except NoResultFound as e:
        print("Creating new target cis_women")
        target_cis_women = Target(
            id=uuid4(),
            program=programme,
            category_value=cat_value_cis_women,
            target_date=datetime.strptime("2022-12-31 00:00:00", "%Y-%m-%d %H:%M:%S"),
            target=float(0.50),
        )
        session.add(target_cis_women)

    target_cis_men = None

    try:
        target_cis_men = (
            session.query(Target)
            .filter(
                Target.program_id == programme.id,
                Target.category_value_id == cat_value_cis_men.id,
            )
            .one()
        )
    except MultipleResultsFound as e:
        print(e)
        exit(1)
    except NoResultFound as e:
        print("Creating new target cis_men")
        target_cis_men = Target(
            id=uuid4(),
            program=programme,
            category_value=cat_value_cis_men,
            target_date=datetime.strptime("2022-12-31 00:00:00", "%Y-%m-%d %H:%M:%S"),
            target=float(0.0),
        )
        session.add(target_cis_men)

    session.commit()

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

        tag = None

        try:
            tag = session.query(Tag).filter(Tag.name == GroupName.strip()).one()
        except MultipleResultsFound as e:
            print(e)
            exit(1)
        except NoResultFound as e:
            print(f"Creating new group name tag {GroupName}")
            tag = Tag(
                id=uuid4(), name=GroupName.strip(), description="", tag_type="imported"
            )
            session.add(tag)
            session.commit()

        dataset = None

        try:
            dataset = (
                session.query(Dataset)
                .filter(Dataset.name == ProgrammeName, Program.team_id == team.id)
                .one()
            )
        except MultipleResultsFound as e:
            print(e)
            exit(1)
        except NoResultFound as e:
            print("Creating new dataset")
            # BBC Contributor
            ptype_id = "1c9b9573-726f-46c4-86a8-ed6412eb0c35"
            ptype = session.query(PersonType).get(ptype_id)
            dataset = Dataset(
                id=uuid4(),
                name=ProgrammeName,
                description="",
                tags=[tag],
                person_types=[ptype],
                program=programme,
            )
            session.add(dataset)

        record = Record(
            id=uuid4(),
            dataset=dataset,
            publication_date=datetime.strptime(
                f"{Year}-{Month}-1 00:00:00", "%Y-%m-%d %H:%M:%S"
            ),
        )

        session.add(record)

        entry1 = Entry(
            id=uuid4(),
            count=int(FemaleRatio),
            record=record,
            category_value=cat_value_cis_women,
        )
        entry2 = Entry(
            id=uuid4(),
            count=int(MaleRatio),
            record=record,
            category_value=cat_value_cis_men,
        )

        session.add(entry1)
        session.add(entry2)

        session.commit()
