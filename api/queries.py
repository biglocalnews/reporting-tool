from datetime import datetime
from enum import Enum
from multiprocessing.dummy import Array
from os import putenv
import time
from typing import cast
from unicodedata import category
from xmlrpc.client import DateTime
from ariadne import convert_kwargs_to_snake_case, ObjectType
from sqlalchemy.orm import Session
from sqlalchemy import DATE, column, func, select
from database import (
    CustomColumn,
    Dataset,
    PublishedRecordSet,
    ReportingPeriod,
    Target,
    User,
    Record,
    Category,
    CategoryValue,
    Entry,
    Team,
    Role,
    PersonType,
    Program,
    Organization,
    Tag,
)

query = ObjectType("Query")
dataset = ObjectType("Dataset")
user = ObjectType("User")
sum_entries_by_category_value = ObjectType("SumEntriesByCategoryValue")

queries = [query, dataset, user, sum_entries_by_category_value]

"""GraphQL query to find a user based on user ID.
    :param obj: obj is a value returned by a parent resolver
    :param info: Has context attribute that contains ContextValue specific to the server implementation.
"""


@query.field("user")
@convert_kwargs_to_snake_case
def resolve_user(obj, info, id):
    """GraphQL query to find a user based on user ID.
    :param id: Id for the user to be fetched
    :returns: User OR None if User was soft-deleted
    """
    session = info.context["dbsession"]
    user = session.query(User).filter(User.id == id).first()
    return user


@user.field("active")
def resolve_user_active(user, info):
    """Field indicating whether user is currently active."""
    return user.deleted is None


@query.field("users")
@convert_kwargs_to_snake_case
def resolve_users(obj, info):
    """GraphQL query to fetch list of all users.
    :returns: List of all users
    """
    session = info.context["dbsession"]
    return session.query(User).order_by(User.username.asc()).all()


@query.field("dataset")
@convert_kwargs_to_snake_case
def resolve_dataset(obj, info, id):
    """GraphQL query to find a dataset based on dataset ID.
    :param id: Id for the dataset to be fetched
    :returns: Dataset OR None if Dataset was soft-deleted
    """
    session = info.context["dbsession"]
    dataset = Dataset.get_not_deleted(session, id)
    return dataset


@dataset.field("lastUpdated")
@convert_kwargs_to_snake_case
def resolve_dataset_last_updated(dataset, info):
    """GraphQL query to find the date a dataset was last updated.
    :param dataset: Dataset object to filter by its ID
    :returns: Datetime scalar
    """
    session = info.context["dbsession"]
    return (
        session.query(func.max(Record.updated))
        .filter(Record.dataset_id == dataset.id, Record.deleted == None)
        .scalar()
    )


# TODO: We may want to move the dataset/category relationship resolvers in the future
# to the statement in the following fuction so we can limit the number of queries
# run per object and avoid N+1 query problem.
# Consider batch queries: https://github.com/graphql/dataloader
@dataset.field("sumOfCategoryValueCounts")
def resolve_sums_of_category_values(dataset, info):
    """GraphQL query to sum the counts in an entry by category value
    :param dataset: Dataset object to filter records by dataset ID
    :returns: Dictionary
    """
    session = info.context["dbsession"]

    stmt = (
        session.query(
            Entry.category_value_id, func.sum(Entry.count).label("sum_of_counts")
        )
        .join(Entry.record)
        .filter(Record.dataset_id == dataset.id, Record.deleted == None)
        .group_by(Entry.category_value_id)
        .all()
    )

    return [
        {"dataset_id": dataset.id, "category_value_id": row[0], "sum_of_counts": row[1]}
        for row in stmt
    ]


@sum_entries_by_category_value.field("dataset")
def resolve_sums_dataset_relationship(count_obj, info):
    """GraphQL query to add dataset relationship to SumEntriesByCategoryValue
    :param count_obj: Object in sumOfCategoryValueCounts dataset field array
    :returns: Dataset dictionary OR None if Dataset was soft-deleted
    """
    session = info.context["dbsession"]
    dataset_rel = Dataset.get_not_deleted(session, count_obj["dataset_id"])
    return dataset_rel


@sum_entries_by_category_value.field("categoryValue")
def resolve_sums_category_relationship(count_obj, info):
    """GraphQL query to add category relationship to SumEntriesByCategoryValue
    :param count_obj: Object in sumOfCategoryValueCounts dataset field array
    :returns: Category dictionary OR None if Category was soft-deleted
    """
    session = info.context["dbsession"]
    category_value_rel = CategoryValue.get_not_deleted(
        session, count_obj["category_value_id"]
    )
    return category_value_rel


@query.field("record")
def resolve_record(obj, info, id):
    """GraphQL query to find a Record based on Record ID.
    :param id: Id for the Record to be fetched
    :returns: Record OR None if Record was soft-deleted
    """
    session = info.context["dbsession"]
    record = Record.get_not_deleted(session, id)
    return record


@query.field("category")
def resolve_category(obj, info, id):
    """GraphQL query to find a Category based on Category ID.
    :param id: Id for the Category to be fetched
    :returns: Category OR None if Category was soft-deleted
    """
    session = info.context["dbsession"]
    category = Category.get_not_deleted(session, id)
    return category


@query.field("targets")
@convert_kwargs_to_snake_case
def resolve_targets(obj, info):
    session = info.context["dbsession"]
    return session.query(Target).order_by(Target.target.desc()).all()


@query.field("categoryValue")
def resolve_category_value(obj, info, id):
    """GraphQL query to find a CategoryValue based on CategoryValue ID.
    :param id: Id for the CategoryValue to be fetched
    :returns: CategoryValue OR None if CategoryValue was deleted
    """
    session = info.context["dbsession"]
    category_value = CategoryValue.get_not_deleted(session, id)
    return category_value


@query.field("tags")
def resolve_tags(obj, info):
    """GraphQL query to return all tags.

    :returns: List of tag objects
    """
    session = info.context["dbsession"]
    return session.query(Tag).filter(Tag.deleted == None).order_by(Tag.name.asc()).all()


@query.field("team")
def resolve_team(obj, info, id):
    """GraphQL query to find a Team based on Team ID.
    :param id: Id for the Team to be fetched
    :returns: Team object
    """
    session = info.context["dbsession"]
    team = session.query(Team).get(id)

    return team


@query.field("teams")
def resolve_teams(obj, info):
    """GraphQL query to fetch full list of teams.

    Only returns non-deleted teams.

    :returns: List of team objects
    """
    session = info.context["dbsession"]
    return (
        session.query(Team).filter(Team.deleted == None).order_by(Team.name.asc()).all()
    )


@query.field("roles")
def resolve_roles(obj, info):
    """GraphQL query to fetch full list of roles.
    :returns: List of role objects
    """
    session = info.context["dbsession"]
    return (
        session.query(Role).filter(Role.deleted == None).order_by(Role.name.asc()).all()
    )


@query.field("program")
def resolve_program(obj, info, id):
    """GraphQL query to fetch a specific program

    :returns: Program object
    """
    session = info.context["dbsession"]
    return session.query(Program).get(id)


@query.field("programs")
def resolve_programs(obj, info):
    """GraphQL query to fetch full list of programs.

    Response includes both active and inactive programs.

    :returns: List of program objects
    """
    session = info.context["dbsession"]
    return session.query(Program).order_by(Program.name.asc()).all()


@query.field("categories")
def resolve_categories(obj, info):
    """GraphQL query to fetch full list of categories.

    Response includes only active categories.

    :returns: List of category objects
    """
    session = info.context["dbsession"]
    return (
        session.query(Category)
        .filter(Category.deleted == None)
        .order_by(Category.name.asc())
        .all()
    )


@query.field("organizations")
def resolve_organizations(obj, info):
    """GraphQL query to fetch all organizations.

    This only returns non-deleted organizations.

    :returns: List of Organization objects
    """
    session = info.context["dbsession"]
    return (
        session.query(Organization)
        .filter(Organization.deleted == None)
        .order_by(Organization.name.asc())
        .all()
    )


@query.field("personTypes")
def resolve_person_types(obj, info):
    """GraphQL query to fetch all person types.

    :returns: List of PersonTypes
    """
    session = info.context["dbsession"]
    return session.query(PersonType).order_by(PersonType.person_type_name.asc()).all()


@query.field("customColumns")
def resolve_person_types(obj, info):
    session = info.context["dbsession"]
    return session.query(CustomColumn).order_by(CustomColumn.name.asc()).all()


@query.field("publishedRecordSet")
def resolve_published_record_set(obj, info, id):
    session = info.context["dbsession"]
    record_set = PublishedRecordSet.get_not_deleted(session, id)
    return record_set


@query.field("publishedRecordSets")
def resolve_published_record_sets(obj, info):
    session = info.context["dbsession"]
    record_sets = session.query(PublishedRecordSet).all()
    return record_sets


@query.field("reportingPeriod")
def resolve_reporting_period(obj, info, id):
    session = info.context["dbsession"]
    rp = session.query(ReportingPeriod).get(id)
    return rp


@query.field("reportingPeriods")
def resolve_reporting_periods(obj, info):
    session = info.context["dbsession"]
    rps = session.query(ReportingPeriod).all()
    return rps


@query.field("stats")
def resolve_stats(obj, info):
    # to get intellisense
    session = cast(Session, info.context["dbsession"])
    stats = {}

    stmt = select(func.count()).select_from(Team).where(Team.deleted == None)
    team_count = session.scalar(stmt)
    stats["teams"] = team_count

    stmt = select(func.count()).select_from(Dataset).where(Dataset.deleted == None)
    datasets_count = session.scalar(stmt)
    stats["datasets"] = datasets_count

    stmt = select(func.count()).select_from(Tag).where(Tag.deleted == None)
    tags_count = session.scalar(stmt)
    stats["tags"] = tags_count

    stmt = (
        select(
            func.jsonb_object_keys(
                func.jsonb_path_query(
                    PublishedRecordSet.document,
                    "$.record.*",
                )
            )
        )
        .select_from(PublishedRecordSet)
        .distinct()
    )

    cats = session.execute(stmt)

    for [category] in cats:
        grouped_by_dataset_year = {}
        stmt = select(
            func.jsonb_path_query_array(
                PublishedRecordSet.document,
                f'$.record.Everyone.{category}.*.* ? ((@.percent > 0 || @.percent == 0) && @.targetMember == true)."percent"',
            ),
            func.jsonb_path_query_first(
                PublishedRecordSet.document,
                f'$.targets[*] ? (@.category == "{category}")."target"',
            ),
            column("dataset_id"),
            column("end"),
        ).select_from(PublishedRecordSet)

        percents = session.execute(stmt, execution_options={"stream_results": True})

        total = 0
        count = 0

        for [percent, target, dataset_id, end] in percents.yield_per(100):
            this_total = sum(percent)
            total += this_total
            count += 1

        stats[category.lower()] = total / count

    consistency_state = Enum("consistency_state", "met almost failed")
    consistency_threshold = 5

    stats["consistencies"] = []

    consistency_counts = {}

    grouped_by_dataset_year = {}
    stmt = select(
        func.jsonb_path_query_array(
            PublishedRecordSet.document,
            f'$.segmentedRecord.*.Gender.entries.* ? ((@.percent > 0 || @.percent == 0) && @.targetMember == true && @.personType like_regex "(?i).*contributor.*")."percent"',
        ),
        func.jsonb_path_query_first(
            PublishedRecordSet.document,
            f'$.targets[*] ? (@.category == "{category}")."target"',
        ),
        column("dataset_id"),
        column("end"),
    ).select_from(PublishedRecordSet)

    percents = session.execute(stmt, execution_options={"stream_results": True})

    for [percent, target, dataset_id, end] in percents.yield_per(100):
        this_total = sum(percent)

        year = end.year
        if dataset_id not in grouped_by_dataset_year:
            grouped_by_dataset_year[dataset_id] = {}

        if year not in grouped_by_dataset_year[dataset_id]:
            grouped_by_dataset_year[dataset_id][year] = []

        if this_total == None or target == None:
            grouped_by_dataset_year[dataset_id][year].append(consistency_state.failed)
        elif this_total >= target:
            grouped_by_dataset_year[dataset_id][year].append(consistency_state.met)
        elif (this_total + consistency_threshold) >= target:
            grouped_by_dataset_year[dataset_id][year].append(consistency_state.almost)
        else:
            grouped_by_dataset_year[dataset_id][year].append(consistency_state.failed)

    for [dataset, years] in grouped_by_dataset_year.items():
        for [year, consistencies] in years.items():
            if year not in consistency_counts:
                consistency_counts[year] = {}
                consistency_counts[year]["consistent"] = 0
                consistency_counts[year]["failed"] = 0
            met = len(
                [True for x in consistencies if x == consistency_state.met]
            ) >= 3 and all(
                [
                    x == consistency_state.met or x == consistency_state.almost
                    for x in consistencies
                ]
            )

            if met:
                consistency_counts[year]["consistent"] += 1
            else:
                consistency_counts[year]["failed"] += 1

    # this suits antd charts
    stats["consistencies"].extend(
        [
            {
                "category": category,
                "year": year,
                "consistency_state": "consistent",
                "value": counts["consistent"],
            }
            for [year, counts] in consistency_counts.items()
        ]
    )
    stats["consistencies"].extend(
        [
            {
                "category": category,
                "year": year,
                "consistency_state": "failed",
                "value": counts["failed"],
            }
            for [year, counts] in consistency_counts.items()
        ]
    )

    stats["lgbtqa"] = 0.0

    return stats
