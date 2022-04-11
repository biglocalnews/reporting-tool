import sys
from typing import Set
from datetime import datetime
import calendar

from uuid import uuid4

from connection import connection

from database import (
    Category,
    CategoryValue,
    Dataset,
    Entry,
    Organization,
    PersonType,
    PublishedRecordSet,
    Record,
    ReportingPeriod,
    Tag,
    Target,
    Track,
    User,
    Team,
    Program,
)
from settings import settings
from sqlalchemy.orm.exc import NoResultFound, MultipleResultsFound
from sqlalchemy import func

import requests
from requests_kerberos import HTTPKerberosAuth
from requests_ntlm import HttpNtlmAuth
from settings import settings

requests.packages.urllib3.disable_warnings(
    requests.packages.urllib3.exceptions.InsecureRequestWarning
)

session = connection()
bbc_org = session.query(Organization).get("15d89a19-b78d-4ee8-b321-043f26bdd48a")
category_gender = session.query(Category).get("51349e29-290e-4398-a401-5bf7d04af75e")


def auth():
    if settings.debug:
        # only works over zscaler bizarrely
        return HTTPKerberosAuth()
    return HttpNtlmAuth("national\\ni-app-tig", settings.app_account_pw)


def get_api_programmes():

    data = []

    try:
        r = requests.get(
            f"https://laravel-api.mobileapps.bbc.co.uk/50-50/programmes",
            verify=False,
            auth=auth(),
        )
        parsed_response = r.json()
        if "data" in parsed_response:
            data = parsed_response["data"]
    except Exception as ex:
        print(ex)

    return data


def get_api_groups():

    data = []

    try:
        r = requests.get(
            f"https://laravel-api.mobileapps.bbc.co.uk/50-50/groups",
            verify=False,
            auth=auth(),
        )
        parsed_response = r.json()
        if "data" in parsed_response:
            data = parsed_response["data"]
    except Exception as ex:
        print(ex)

    return data


def get_api_records(prog_id):

    data = []

    try:
        r = requests.get(
            f"https://laravel-api.mobileapps.bbc.co.uk/50-50/{prog_id}/entries",
            verify=False,
            auth=auth(),
        )
        parsed_response = r.json()
        if "data" in parsed_response:
            data = parsed_response["data"]
    except Exception as ex:
        print(ex)

    return data


def get_api_user(email):

    user = None

    try:
        r = requests.get(
            f"https://laravel-api.mobileapps.bbc.co.uk/people/query?email={email}",
            verify=False,
            auth=auth(),
        )
        parsed_response = r.json()
        if "data" in parsed_response:
            users = parsed_response["data"]
            if len(users) > 1:
                print(
                    f"More than one user with the same email {email} found, that's weird"
                )
                print(users)
                exit(1)
            if not len(users):
                print(f"User {email} not found in api")
            if len(users) == 1:
                user = users[0]
    except Exception as ex:
        print(ex)

    return user


def get_tag(tag_name):
    tag_name = tag_name.strip()
    if not tag_name:
        return None
    db_tag = None

    try:
        db_tag = (
            session.query(Tag).filter(func.lower(Tag.name) == tag_name.lower()).one()
        )
    except MultipleResultsFound as e:
        print(f"{sys._getframe(  ).f_code.co_name} {e}")
        exit(1)
    except NoResultFound as e:
        print(f"Tag {tag_name} not found in 5050 db")

    if not db_tag:
        db_tag = Tag(
            id=uuid4(),
            name=tag_name,
            tag_type="unassigned",
            description="",
        )
        session.add(db_tag)

    return db_tag


def get_team(team_name):
    db_team = None
    team_name = team_name.strip()
    if not team_name:
        return None
    try:
        db_team = (
            session.query(Team).filter(func.lower(Team.name) == team_name.lower()).one()
        )
    except MultipleResultsFound as e:
        print(f"{sys._getframe(  ).f_code.co_name} {e}")
        exit(1)
    except NoResultFound as e:
        print(e)

    if not db_team:
        print(f"Team {team_name} not found, creating new team")
        db_team = Team(id=uuid4(), name=team_name, organization=bbc_org)
        session.add(db_team)

    return db_team


non_bbc_emails = []


def get_user(email):
    email = email.strip()
    if not email or "@" not in email:
        print(f"non email address {email}")
        return None
    email = email.lower()

    email_components = email.split("@")

    if len(email_components) != 2:
        print(f"invalid email address {email}")
        return None

    bbc_user = True

    if "bbc" not in email_components[1]:
        non_bbc_emails.append(email)
        print(f"non bbc email address {email}")
        bbc_user = False

    db_user = None

    try:
        db_user = session.query(User).filter(func.lower(User.email) == email).one()
    except MultipleResultsFound as e:
        print(f"{sys._getframe(  ).f_code.co_name} {e}")
        exit(1)
    except NoResultFound as e:
        print(f"User {email} not found in 5050 db")

    if not db_user:
        first_name = None
        last_name = None
        username = None
        if bbc_user:
            api_user = get_api_user(email)
            if not api_user:
                return None
            if (
                "accountName" not in api_user
                or "givenName" not in api_user
                or "surname" not in api_user
            ):
                print(f"{email} doesn't return all the normal metadata from the api")
                return None
            first_name = api_user["givenName"]
            last_name = api_user["surname"]
            username = api_user["accountName"].lower()
        else:
            # try and see if we can split it and get a name, seems they mostly follow this pattern
            username_components = email_components[0].split(".")
            if len(username_components) > 1:
                first_name = username_components[0]
                last_name = username_components[-1]
            else:
                first_name = email_components[0]
                last_name = ""
            username = email

        db_user = User(
            id=uuid4(),
            first_name=first_name,
            last_name=last_name,
            username=username,
            email=email,
            hashed_password=hash(uuid4()),
        )
        session.add(db_user)

    return db_user


def get_attribute(attribute_name, db_category):

    attribute_name = attribute_name.strip()

    if not attribute_name:
        return None

    db_attribute = None

    try:
        db_attribute = (
            session.query(CategoryValue)
            .filter(func.lower(CategoryValue.name) == attribute_name.lower())
            .one()
        )
    except MultipleResultsFound as e:
        print(f"{sys._getframe(  ).f_code.co_name} {e}")
        exit(1)
    except NoResultFound as e:
        print(f"Creating new attribute {attribute_name}")

    if not db_attribute:
        db_attribute = CategoryValue(
            id=uuid4(), name=attribute_name, category=db_category
        )
        session.add(db_attribute)
    return db_attribute


def get_target(db_category, db_programme):
    # assumes Gender because thats all we have in the old data
    target = None

    try:
        target = (
            session.query(Target)
            .filter(
                Target.program_id == db_programme.id, Target.category == db_category
            )
            .one()
        )
    except MultipleResultsFound as e:
        print(f"{sys._getframe(  ).f_code.co_name} {e}")
        exit(1)
    except NoResultFound as e:
        print(f"Creating new target for {db_category.name}")

    if not target:
        target = Target(
            id=uuid4(),
            program=db_programme,
            category=db_category,
            target_date=datetime.strptime("2022-12-31 00:00:00", "%Y-%m-%d %H:%M:%S"),
            target=float(0.50),
        )
        session.add(target)

    target.tracks.append(
        Track(
            id=uuid4(),
            category_value=get_attribute("Women", category_gender),
            target_member=True,
        )
    )
    target.tracks.append(
        Track(
            id=uuid4(),
            category_value=get_attribute("Men", category_gender),
            target_member=False,
        )
    )

    return target


def get_programme(programme_name):
    programme_name = programme_name.strip()
    if not programme_name:
        return None
    db_programme = None

    try:
        db_programme = (
            session.query(Program)
            .filter(func.lower(Program.name) == programme_name.lower())
            .one()
        )
    except MultipleResultsFound as e:
        print(f"{sys._getframe(  ).f_code.co_name} {e}")
        exit(1)
    except NoResultFound as e:
        print(f"Program {programme_name} not found in 5050 db")

    if not db_programme:
        db_programme = Program(id=uuid4(), name=programme_name, description="")
        session.add(db_programme)

    return db_programme


def get_person_type(person_type_name):
    person_type_name = person_type_name.strip()
    if not person_type_name:
        return None
    db_person_type = None

    try:
        db_person_type = (
            session.query(PersonType)
            .filter(func.lower(PersonType.person_type_name) == person_type_name.lower())
            .one()
        )
    except MultipleResultsFound as e:
        print(f"{sys._getframe(  ).f_code.co_name} {e}")
        exit(1)
    except NoResultFound as e:
        print(f"PersonType {person_type_name} not found in 5050 db")

    if not db_person_type:
        db_person_type = PersonType(id=uuid4(), person_type_name=person_type_name)

        session.add(db_person_type)

    return db_person_type


def get_dataset(programme, dataset_name, everyone_person_type):
    dataset_name = dataset_name.strip()
    if not dataset_name:
        return None
    db_dataset = None

    try:
        db_dataset = (
            session.query(Dataset)
            .filter(
                Dataset.program == programme,
                func.lower(Dataset.name) == dataset_name.lower(),
            )
            .one()
        )
    except MultipleResultsFound as e:
        print(f"{sys._getframe(  ).f_code.co_name} {e}")
        exit(1)
    except NoResultFound as e:
        print(f"Dataset {dataset_name} not found in 5050 db")

    if not db_dataset:
        db_dataset = Dataset(
            id=uuid4(),
            name=dataset_name,
            description="",
            person_types=[everyone_person_type],
            program=programme,
        )
        session.add(db_dataset)

    return db_dataset


def get_record(dataset, publication_date, created, updated):

    if not publication_date:
        return None

    db_record = None

    try:
        db_record = (
            session.query(Record)
            .filter(
                Record.dataset == dataset,
                Record.publication_date == publication_date,
            )
            .one()
        )
    except MultipleResultsFound as e:
        print(f"{sys._getframe(  ).f_code.co_name} {e}")
        exit(1)
    except NoResultFound as e:
        print(f"Record for {publication_date} not found in 5050 db")

    if not db_record:
        db_record = Record(
            id=uuid4(), publication_date=publication_date, dataset=dataset
        )

        session.add(db_record)

    if created:
        try:
            created = int(created)
            db_record.created = datetime.fromtimestamp(created)
        except Exception as ex:
            print(f"invalid timestamp for dataset {dataset.name}: {created}")

    if updated:
        try:
            updated = int(updated)
            db_record.updated = datetime.fromtimestamp(updated)
        except Exception as ex:
            print(f"invalid timestamp for dataset {dataset.name}: {updated}")

    return db_record


def get_reporting_period(programme, year, month):

    if not year or not month:
        return None

    begin = datetime(year, month, 1)
    end = datetime(year, month, calendar.monthrange(year, month)[1], 23, 59, 59)

    db_reporting_period = None

    try:
        db_reporting_period = (
            session.query(ReportingPeriod)
            .filter(
                ReportingPeriod.program == programme,
                ReportingPeriod.begin == begin,
                ReportingPeriod.end == end,
            )
            .one()
        )
    except MultipleResultsFound as e:
        print(f"{sys._getframe(  ).f_code.co_name} {e}")
        exit(1)
    except NoResultFound as e:
        print(
            f"Reporting period starting {begin} and ending {end} not found in 5050 db"
        )

    if not db_reporting_period:
        db_reporting_period = ReportingPeriod(
            id=uuid4(), begin=begin, end=end, program=programme
        )

        session.add(db_reporting_period)

    return db_reporting_period


def get_published_record_set(
    team: Team,
    programme: Program,
    dataset: Dataset,
    reporting_period: ReportingPeriod,
    record: Record,
):

    if not team or not programme or not dataset or not reporting_period or not record:
        return None

    db_published_record_set = None

    try:
        db_published_record_set = (
            session.query(PublishedRecordSet)
            .filter(
                PublishedRecordSet.reporting_period == reporting_period,
                PublishedRecordSet.begin == reporting_period.begin,
                PublishedRecordSet.end == reporting_period.end,
            )
            .one()
        )
    except MultipleResultsFound as e:
        print(f"{sys._getframe(  ).f_code.co_name} {e}")
        exit(1)
    except NoResultFound as e:
        print(
            f"Published record set starting {reporting_period.begin} and ending {reporting_period.begin} not found in 5050 db"
        )

    record = {
        "Everyone": {
            "Gender": {
                "entries": {
                    "Men": {
                        "percent": next(
                            x.count
                            for x in record.entries
                            if x.category_value.name == "Men"
                        ),
                        "category": "Gender",
                        "attribute": "Men",
                        "personType": "Everyone",
                        "targetMember": False,
                    },
                    "Women": {
                        "percent": next(
                            x.count
                            for x in record.entries
                            if x.category_value.name == "Women"
                        ),
                        "category": "Gender",
                        "attribute": "Women",
                        "personType": "Everyone",
                        "targetMember": True,
                    },
                }
            }
        }
    }

    document = {
        "datasetName": dataset.name,
        "teamName": team.name,
        "datasetGroup": programme.name,
        "reportingPeriodDescription": reporting_period.description,
        "begin": str(reporting_period.begin),
        "end": str(reporting_period.end),
        "targets": [
            {"category": x.category.name, "target": x.target * 100}
            for x in programme.targets
        ],
        "datasetGroupTags": [
            {"name": x.name, "group": x.tag_type} for x in programme.tags
        ],
        "datasetTags": [{"name": x.name, "group": x.tag_type} for x in programme.tags],
        "record": record,
        "segmentedRecord": record,
    }

    if not db_published_record_set:
        db_published_record_set = PublishedRecordSet(
            id=uuid4(),
            begin=reporting_period.begin,
            end=reporting_period.end,
            reporting_period=reporting_period,
            dataset=dataset,
        )
        session.add(db_published_record_set)

    db_published_record_set.document = document

    return db_published_record_set


"""
for group in get_api_groups():
    if "groupName" not in group or not group["groupName"]:
        continue
    get_tag(group["groupName"])

session.commit()
"""


groups = get_api_groups()

for programme in get_api_programmes():

    user_emails = (
        programme["emails"].strip().split(";")
        if "emails" in programme and len(programme["emails"]) > 8
        else []
    )

    db_users: Set[User] = []

    if len(user_emails) == 0:
        print(f'programme {programme["name"]} has no contacts, that\'s weird')
        continue

    for email in set(user_emails):
        db_user = get_user(email)
        if db_user:
            db_users.append(db_user)

    db_team = get_team(programme["team"])

    if db_team:
        for db_user in db_users:
            if not db_user.username.lower() in [
                x.username.lower() for x in db_team.users
            ]:
                db_team.users.append(db_user)
                print(
                    f'{db_user.first_name} {db_user.last_name} added to Team {programme["team"]}'
                )

        session.add(db_team)

    db_programme = get_programme(programme["name"])

    if not db_programme.id in [x.id for x in db_team.programs]:
        db_team.programs.append(db_programme)

    everyone_person_type = get_person_type("Everyone")

    db_dataset = get_dataset(db_programme, programme["name"], everyone_person_type)

    if category_gender not in [x.category for x in db_programme.targets]:
        db_programme.targets.append(get_target(category_gender, db_programme))

    for tag in [
        x["groupName"]
        for x in groups
        if programme["id"] in [y["id"] for y in x["programmes"]["data"]]
    ]:
        if tag not in [x.name for x in db_programme.tags]:
            db_programme.tags.append(get_tag(tag))

    male_attribute = get_attribute("Men", category_gender)
    female_attribute = get_attribute("Women", category_gender)

    prev_month_year = None

    for record in sorted(
        get_api_records(programme["id"]), key=lambda x: int(f'{x["year"]}{x["month"]}')
    ):

        db_record = get_record(
            db_dataset,
            datetime(day=1, month=record["month"], year=record["year"]),
            record["createdAt"],
            record["updatedAt"],
        )
        if len(db_record.entries) == 0:
            male_entry = Entry(
                id=uuid4(),
                category_value=male_attribute,
                record=db_record,
                count=record["maleRatio"],
                person_type=everyone_person_type,
            )
            female_entry = Entry(
                id=uuid4(),
                category_value=female_attribute,
                record_id=db_record.id,
                count=record["femaleRatio"],
                person_type=everyone_person_type,
            )
            session.add(male_entry)
            session.add(female_entry)
            db_record.entries.append(male_entry)
            db_record.entries.append(female_entry)

        db_reporting_period = get_reporting_period(
            db_programme, record["year"], record["month"]
        )
        db_published_record_set = get_published_record_set(
            db_team, db_programme, db_dataset, db_reporting_period, db_record
        )

    db_programme.reporting_period_type = "monthly"

    session.commit()

[print(x) for x in non_bbc_emails]
