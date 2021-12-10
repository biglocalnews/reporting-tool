import uuid
import secrets

import mailer
from user import fastapi_users, UserCreateModel, UserRole, get_valid_token
from ariadne import convert_kwargs_to_snake_case, ObjectType
from settings import settings
from database import (
    Category,
    CategoryValue,
    Dataset,
    Entry,
    Organization,
    Program,
    PublishedRecordSet,
    ReportingPeriod,
    Record,
    Role,
    Tag,
    User,
    Target,
    Track,
    Team,
)
from sqlalchemy.orm import joinedload
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.sql import func
from fastapi_users.router.verify import VERIFY_USER_TOKEN_AUDIENCE


mutation = ObjectType("Mutation")

"""GraphQL query defaults
    :param obj: obj is a value returned by a parent resolver
    :param info: Has context attribute that contains ContextValue specific to the server implementation.
"""


@mutation.field("createDataset")
@convert_kwargs_to_snake_case
def resolve_create_dataset(obj, info, input):
    """GraphQL query to create a Dataset.
    :param input: Params to be changed
    :returns: Dataset dictionary
    """
    session = info.context["dbsession"]
    all_tags = input.pop("tags", [])
    tags = []
    for tag in all_tags:
        standardized_tag_name = Tag.get_by_name(session, input["name"])
        existing_tag = (
            session.query(Tag).filter(Tag.name == standardized_tag_name).first()
        )
        if existing_tag:
            tags.append(existing_tag)
        else:
            new_tag = Tag(**tag)
            tags.append(new_tag)
            session.add(new_tag)
    dataset = Dataset(tags=tags, **input)
    session.add(dataset)
    session.commit()

    return dataset


@mutation.field("deleteDataset")
def resolve_delete_dataset(obj, info, id):
    """GraphQL mutation to soft delete a Dataset.
    :param id: UUID of Dataset to be soft deleted
    :returns: UUID of soft deleted Dataset
    """
    session = info.context["dbsession"]
    dataset = Dataset.get_not_deleted(session, id)
    if dataset is not None:
        dataset.soft_delete(session)
    session.commit()

    return id


@mutation.field("updateDataset")
@convert_kwargs_to_snake_case
def resolve_update_dataset(obj, info, input):
    """GraphQL mutation to update a Dataset.
    :param input: Params to be changed
    :returns: Updated Dataset
    """
    session = info.context["dbsession"]
    dataset = session.query(Dataset).get(input["id"])
    all_tags = input.pop("tags", [])
    for tag in all_tags:
        standardized_tag_name = Tag.get_by_name(session, input["name"])
        existing_tag = (
            session.query(Tag).filter(Tag.name == standardized_tag_name).first()
        )
        if existing_tag:
            dataset.tags.append(existing_tag)
        else:
            new_tag = Tag(**tag)
            dataset.tags.append(new_tag)
            session.add(new_tag)
    for param in input:
        setattr(dataset, param, input[param])
    session.add(dataset)
    session.commit()

    return dataset


@mutation.field("createRecord")
@convert_kwargs_to_snake_case
def resolve_create_record(obj, info, input):
    """GraphQL mutation to create a Record.
    :param input: params for new Record
    :returns: Record dictionary
    """

    session = info.context["dbsession"]
    current_user = info.context["current_user"]

    all_entries = input.pop("entries", [])
    n_entries = []
    for entry in all_entries:
        n_entries.append(Entry(inputter=current_user, **entry))
    record = Record(entries=n_entries, **input)
    session.add(record)
    session.commit()

    return record


@mutation.field("updateRecord")
@convert_kwargs_to_snake_case
def resolve_update_record(obj, info, input):
    """GraphQL mutation to update a Record.
    :param input: params to update Record
    :returns: Record dictionary
    """
    session = info.context["dbsession"]
    current_user = info.context["current_user"]

    record = session.query(Record).get(input["id"])
    all_entries = input.pop("entries", [])
    for entry in all_entries:
        existing_entry = session.query(Entry).get(entry.get("id"))
        if existing_entry:
            if str(existing_entry.record_id) == input["id"]:
                session.merge(Entry(**entry))
            else:
                raise NoResultFound(
                    f"No Entry with id: {existing_entry.id} associated with Record id: {record.id} was found."
                )
        else:
            Entry(record=record, inputter=current_user, **entry)
    for param in input:
        setattr(record, param, input[param])
    session.add(record)
    session.commit()

    return record


@mutation.field("deleteRecord")
def resolve_delete_record(obj, info, id):
    """GraphQL mutation to soft delete a Record.
    :param id: UUID of Record to be soft deleted
    :returns: UUID of soft deleted Record
    """
    session = info.context["dbsession"]
    record = Record.get_not_deleted(session, id)
    if record is not None:
        record.soft_delete(session)
    session.commit()

    return id


@mutation.field("createCategory")
@convert_kwargs_to_snake_case
def resolve_create_category(obj, info, input):
    """GraphQL mutation to create a Category.
    :param input: params for new Category
    :returns: Category dictionary
    """

    session = info.context["dbsession"]
    standardized_category_name = Category.get_by_name(session, input["name"])
    existing_category = (
        session.query(Category)
        .filter(Category.name == standardized_category_name)
        .first()
    )
    if existing_category:
        return existing_category
    else:
        category = Category(**input)
        session.add(category)
        session.commit()

    return category


@mutation.field("updateCategory")
@convert_kwargs_to_snake_case
def resolve_update_category(obj, info, input):
    """GraphQL mutation to update a Category
    :param input: Params to be changed
    :returns: Updated Category
    """

    session = info.context["dbsession"]
    category = session.query(Category).get(input["id"])
    for param in input:
        setattr(category, param, input[param])
    session.add(category)
    session.commit()

    return category


@mutation.field("deleteCategory")
def resolve_delete_category(obj, info, id):
    """GraphQL mutation to soft delete a Category.
    :param id: UUID of Category to be soft deleted
    :returns: UUID of soft deleted Category
    """
    session = info.context["dbsession"]
    category = Category.get_not_deleted(session, id)
    if category is not None:
        category.soft_delete(session)
    session.commit()

    return id


@mutation.field("createCategoryValue")
@convert_kwargs_to_snake_case
def resolve_create_category_value(obj, info, input):
    """GraphQL mutation to create a CategoryValue.
    :param input: params for new CategoryValue
    :returns: CategoryValue dictionary
    """

    session = info.context["dbsession"]
    category_value = CategoryValue(**input)
    session.add(category_value)
    session.commit()

    return category_value


@mutation.field("updateCategoryValue")
@convert_kwargs_to_snake_case
def resolve_update_category_value(obj, info, input):
    """GraphQL mutation to update a CategoryValue.
    :param input: params to be changed
    :returns: updated CategoryValue dictionary
    """

    session = info.context["dbsession"]
    category_value = session.query(CategoryValue).get(input["id"])
    for param in input:
        setattr(category_value, param, input[param])
    session.add(category_value)
    session.commit()

    return category_value


@mutation.field("deleteCategoryValue")
def resolve_delete_category_value(obj, info, id):
    """GraphQL mutation to delete a CategoryValue.
    :param id: UUID of CategoryValue to be deleted
    :returns: UUID of deleted CategoryValue
    """
    session = info.context["dbsession"]
    category_value = CategoryValue.get_not_deleted(session, id)
    if category_value is not None:
        category_value.soft_delete(session)
    session.commit()

    return id


@mutation.field("createTeam")
@convert_kwargs_to_snake_case
def resolve_create_team(obj, info, input):
    """GraphQL mutation to create a Team
    :param input: params for new Team
    :returns: Team dictionary
    """

    session = info.context["dbsession"]
    current_user = info.context["current_user"]

    users = input.pop("user_ids", [])
    programs = input.pop("program_ids", [])

    # TODO: https://app.clubhouse.io/stanford-computational-policy-lab/story/329/give-admin-option-to-select-which-organization-a-team-should-be-a-part-of
    # Should check and make sure that the user has permission to create the team
    # in the provided organization.
    team = Team(**input)

    team.programs += [session.merge(Program(id=program_id)) for program_id in programs]
    team.users += [session.merge(User(id=user_id)) for user_id in users]

    session.add(team)
    session.commit()

    return team


@mutation.field("updateTeam")
@convert_kwargs_to_snake_case
def resolve_update_team(obj, info, input):
    """GraphQL mutation to update a Team
    :param input: params for updated Team
    :returns: Team dictionary
    """

    session = info.context["dbsession"]
    team = session.query(Team).get(input["id"])
    if "user_ids" in input:
        users = input.pop("user_ids")
        team.users = [session.merge(User(id=user_id)) for user_id in users]
    if "program_ids" in input:
        programs = input.pop("program_ids")
        team.programs = [
            session.merge(Program(id=program_id)) for program_id in programs
        ]
    for param in input:
        setattr(team, param, input[param])
    session.add(team)
    session.commit()

    return team


@mutation.field("deleteTeam")
@convert_kwargs_to_snake_case
def resolve_delete_team(obj, info, id):
    """GraphQL mutation to delete a Team

    Unlike most operations, this does a *hard* delete. Deleted teams cannot be
    restored. This operation verifies that the team is empty before allowing
    the delete to proceed (so no users or programs get orphaned).

    :param id: UUID of Team to be deleted
    :returns: UUID of deleted Team
    """

    session = info.context["dbsession"]
    team = session.query(Team).get(id)
    if not team:
        raise Exception("Team not found")
    if team.programs or team.users:
        raise Exception("Cannot delete non-empty team")
    session.query(Team).filter(Team.id == id).delete()
    session.commit()

    return id


@mutation.field("createProgram")
@convert_kwargs_to_snake_case
def resolve_create_program(obj, info, input):
    """GraphQL mutation to create a Program.
    :param input: params for new Program
    :returns: Program object
    """
    session = info.context["dbsession"]
    datasets = input.pop("datasets", [])
    targets_input = input.pop("targets", [])
    tags = input.pop("tags", [])
    reporting_periods = input.pop("reporting_periods", [])
    if "description" not in input:
        input["description"] = ""

    program = Program(**input)
    program.datasets = Dataset.upsert_datasets(session, datasets)
    for tag_dict in tags:
        tag = Tag.get_or_create(session, tag_dict)
        program.tags.append(tag)

    for target_input in targets_input:

        category_input = target_input.pop("category")
        tracks_input = target_input.pop("tracks")

        c = session.query(Category).get(category_input["id"])

        target = Target(**target_input, target_date=func.now(), category=c)

        for track_input in tracks_input:
            cv_input = track_input.pop("category_value")
            cv = session.query(CategoryValue).get(cv_input["id"])
            track = Track.get_or_create(session, target.id, cv.id, track_input)
            track.category_value = cv
            target.tracks.append(track)

        program.targets.append(target)

    session.add(program)
    session.commit()

    return program


@mutation.field("updateProgram")
@convert_kwargs_to_snake_case
def resolve_update_program(obj, info, input):
    """GraphQL mutation to update a Program.
    :param input: params for updated Program
    :returns: Updated Program dictionary
    """
    session = info.context["dbsession"]
    program = session.query(Program).get(input.pop("id"))

    if "team_id" in input:
        program.team = session.merge(Team(id=input.pop("team_id")))

    if "targets" in input:
        program.targets = []
        # child dicts and arrays need to be popped out of the input dictionary because in order to be saved to the Db, they need to be
        # actual sql alchemy entities

        for target_input in input.pop("targets"):
            category_input = target_input.pop("category")
            c = Category.get_or_create(session, category_input)
            tracks_input = target_input.pop("tracks")
            target = Target.get_or_create(session, program.id, target_input, c.id)
            target.category = c
            for track_input in tracks_input:
                cv_input = track_input.pop("category_value")
                cv = CategoryValue.get_or_create(session, cv_input)
                track = Track.get_or_create(session, target.id, cv.id, track_input)
                track.category_value = cv
                target.tracks.append(track)

            program.targets.append(target)

    if "datasets" in input:
        program.datasets = Dataset.upsert_datasets(session, input.pop("datasets"))

    if "reporting_periods" in input:
        program.reporting_periods = []
        # child dicts and arrays need to be popped out of the input dictionary because in order to be saved to the Db, they need to be
        # actual sql alchemy entities

        for rp_input in input.pop("reporting_periods"):
            if "program_id" not in rp_input or not rp_input["program_id"]:
                rp_input["program_id"] = program.id
            if "id" in rp_input and rp_input["id"]:
                rp_input["id"] = uuid.UUID(rp_input["id"])
            [rp_input["begin"], rp_input["end"]] = rp_input.pop("range")
            rp = session.merge(ReportingPeriod(**rp_input))
            program.reporting_periods.append(rp)

    if "tags" in input:
        program.tags = []

        for tag_dict in input.pop("tags"):
            tag = Tag.get_or_create(session, tag_dict)
            program.tags.append(tag)

    for key, value in input.items():
        setattr(program, key, value)

    session.merge(program)
    session.commit()
    return program


@mutation.field("deleteProgram")
def resolve_delete_program(obj, info, id):
    """GraphQL mutation to delete a Program.
    :param id: UUID of Program to be deleted
    :returns: UUID of deleted Program
    """
    session = info.context["dbsession"]
    program = Program.get_not_deleted(session, id)
    if program is not None:
        program.soft_delete(session)
    session.commit()

    return id


@mutation.field("restoreProgram")
def resolve_restore_program(obj, info, id):
    """GraphQL mutation to restore a deleted Program.
    :param id: UUID of Program to be restored
    :returns: Program object
    """
    session = info.context["dbsession"]
    program = session.query(Program).get(id)
    if program:
        program.deleted = None
        session.merge(program)
    session.commit()

    return program


@mutation.field("configureApp")
@convert_kwargs_to_snake_case
async def resolve_configure_app(obj, info, input):
    """GraphQL mutation to configure the app when it's first opened.

    :param input: Config parameters
    :returns: User object of the new admin
    """
    session = info.context["dbsession"]
    org = Organization(name=input.pop("organization"))
    session.add(org)
    session.commit()

    # Create a good temporary password
    temp_password = password = secrets.token_urlsafe(16)
    # Get a list of roles to grant this person
    super_roles = session.query(Role).filter(Role.name == "admin").all()
    # Create the new user
    new_user = UserCreateModel(
        email=input["email"],
        first_name=input["first_name"],
        last_name=input["last_name"],
        password=temp_password,
        is_superuser=True,
        roles=[UserRole(id=role.id) for role in super_roles],
        teams=[],
    )

    user = await fastapi_users.create_user(new_user)

    # Send temp password.
    # TODO: Unify the email to streamline this process
    # https://app.clubhouse.io/stanford-computational-policy-lab/story/334/unify-registration-emails
    await mailer.send_register_email(user, temp_password)
    token = get_valid_token(
        VERIFY_USER_TOKEN_AUDIENCE,
        user_id=str(user.id),
        email=user.email,
    )
    await mailer.send_verify_request_email(user, token)

    return user.id


@mutation.field("createPublishedRecordSet")
@convert_kwargs_to_snake_case
def resolve_create_published_record_set(obj, info, input):
    session = info.context["dbsession"]
    record = PublishedRecordSet(**input)
    session.add(record)
    session.commit()

    return record


@mutation.field("createReportingPeriod")
@convert_kwargs_to_snake_case
def resolve_create_reporting_period(obj, info, input):
    session = info.context["dbsession"]
    [input["begin"], input["end"]] = input.pop("range")
    rp = ReportingPeriod(**input)
    session.add(rp)
    session.commit()

    return rp
