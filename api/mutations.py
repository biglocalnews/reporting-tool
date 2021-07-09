import uuid

from ariadne import convert_kwargs_to_snake_case, ObjectType
from settings import settings
from database import SessionLocal, User, Dataset, Tag, Program, Record, Entry, Category, Target, CategoryValue, Team
from sqlalchemy.orm import joinedload
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.sql import func

mutation = ObjectType("Mutation")

'''GraphQL query defaults
    :param obj: obj is a value returned by a parent resolver
    :param info: Has context attribute that contains ContextValue specific to the server implementation.
'''

@mutation.field("createDataset")
@convert_kwargs_to_snake_case
def resolve_create_dataset(obj, info, input):
    '''GraphQL query to create a Dataset.
        :param input: Params to be changed 
        :returns: Dataset dictionary
    '''
    session = info.context['dbsession']
    all_tags = input.pop('tags', [])
    tags = []
    for tag in all_tags:
        standardized_tag_name = Tag.get_by_name(session, input["name"])
        existing_tag = session.query(Tag).filter(Tag.name == standardized_tag_name).first()
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
    '''GraphQL mutation to soft delete a Dataset.
        :param id: UUID of Dataset to be soft deleted
        :returns: UUID of soft deleted Dataset
    '''
    session = info.context['dbsession']
    dataset = Dataset.get_not_deleted(session, id)
    if dataset is not None:
        dataset.soft_delete(session) 
    session.commit()

    return id

@mutation.field("updateDataset")
@convert_kwargs_to_snake_case
def resolve_update_dataset(obj, info, input):
    '''GraphQL mutation to update a Dataset.
        :param input: Params to be changed
        :returns: Updated Dataset
    '''
    session = info.context['dbsession']
    dataset = session.query(Dataset).get(input['id'])
    all_tags = input.pop('tags', [])
    for tag in all_tags:
        standardized_tag_name = Tag.get_by_name(session, input["name"])
        existing_tag = session.query(Tag).filter(Tag.name == standardized_tag_name).first()
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
    '''GraphQL mutation to create a Record.
        :param input: params for new Record
        :returns: Record dictionary
    '''

    session = info.context['dbsession']
    current_user = info.context['current_user']

    all_entries = input.pop('entries', [])
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
    '''GraphQL mutation to update a Record.
        :param input: params to update Record
        :returns: Record dictionary
    '''
    session = info.context['dbsession']
    current_user = info.context['current_user']

    record = session.query(Record).get(input['id'])
    all_entries = input.pop('entries', [])
    for entry in all_entries:  
        existing_entry = session.query(Entry).get(entry.get('id'))
        if existing_entry:
            if str(existing_entry.record_id) == input['id']:
                session.merge(Entry(**entry))
            else:   
                raise NoResultFound(f'No Entry with id: {existing_entry.id} associated with Record id: {record.id} was found.')
        else:
            Entry(record=record, inputter=current_user, **entry)
    for param in input:
        setattr(record, param, input[param])
    session.add(record)
    session.commit()

    return record 

@mutation.field("deleteRecord")
def resolve_delete_record(obj, info, id):
    '''GraphQL mutation to soft delete a Record.
        :param id: UUID of Record to be soft deleted
        :returns: UUID of soft deleted Record
    '''
    session = info.context['dbsession']
    record = Record.get_not_deleted(session, id)
    if record is not None:
        record.soft_delete(session)
    session.commit()
    
    return id

@mutation.field("createCategory")
@convert_kwargs_to_snake_case
def resolve_create_category(obj, info, input):
    '''GraphQL mutation to create a Category.
        :param input: params for new Category
        :returns: Category dictionary
    '''

    session = info.context['dbsession']
    standardized_category_name = Category.get_by_name(session, input["name"])
    existing_category = session.query(Category).filter(Category.name == standardized_category_name).first()
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
    '''GraphQL mutation to update a Category
        :param input: Params to be changed
        :returns: Updated Category
    '''

    session = info.context['dbsession']
    category = session.query(Category).get(input['id'])
    for param in input:
        setattr(category, param, input[param])
    session.add(category)
    session.commit()
    
    return category

@mutation.field("deleteCategory")
def resolve_delete_category(obj, info, id):
    '''GraphQL mutation to soft delete a Category.
        :param id: UUID of Category to be soft deleted
        :returns: UUID of soft deleted Category
    '''
    session = info.context['dbsession']
    category = Category.get_not_deleted(session, id)
    if category is not None:
        category.soft_delete(session)
    session.commit()
    
    return id

@mutation.field("createCategoryValue")
@convert_kwargs_to_snake_case
def resolve_create_category_value(obj, info, input):
    '''GraphQL mutation to create a CategoryValue.
        :param input: params for new CategoryValue
        :returns: CategoryValue dictionary
    '''

    session = info.context['dbsession']
    category_value = CategoryValue(**input)
    session.add(category_value)
    session.commit()
    
    return category_value

@mutation.field("updateCategoryValue")
@convert_kwargs_to_snake_case
def resolve_update_category_value(obj, info, input):
    '''GraphQL mutation to update a CategoryValue.
        :param input: params to be changed
        :returns: updated CategoryValue dictionary
    '''
    
    session = info.context['dbsession']
    category_value = session.query(CategoryValue).get(input['id'])
    for param in input:
        setattr(category_value, param, input[param])
    session.add(category_value)
    session.commit()
    
    return category_value

@mutation.field("deleteCategoryValue")
def resolve_delete_category_value(obj, info, id):
    '''GraphQL mutation to delete a CategoryValue.
        :param id: UUID of CategoryValue to be deleted
        :returns: UUID of deleted CategoryValue
    '''
    session = info.context['dbsession']
    category_value = CategoryValue.get_not_deleted(session, id)
    if category_value is not None:
        category_value.soft_delete(session)
    session.commit()

    return id

@mutation.field("createTeam")
@convert_kwargs_to_snake_case
def resolve_create_team(obj, info, input):
    '''GraphQL mutation to create a Team
        :param input: params for new Team
        :returns: Team dictionary
    '''

    session = info.context['dbsession']
    users = input.pop('user_ids')
    programs = input.pop('program_ids')
    
    team = Team(**input)
    team.programs += [session.merge(Program(id=program_id)) for program_id in programs]
    team.users += [session.merge(User(id=user_id)) for user_id in users]

    session.add(team)
    session.commit()
    
    return team

@mutation.field("updateTeam")
@convert_kwargs_to_snake_case
def resolve_update_team(obj, info, input):
    '''GraphQL mutation to update a Team
        :param input: params for updated Team
        :returns: Team dictionary
    '''

    session = info.context['dbsession']
    team = session.query(Team).get(input['id'])
    users = input.pop('user_ids', [])
    programs = input.pop('program_ids', [])
    if len(users) > 0:
        team.users = [session.merge(User(id=user_id)) for user_id in users]
    if len(programs) > 0:
        team.programs = [session.merge(Program(id=program_id)) for program_id in programs]
    for param in input:
        setattr(team, param, input[param])
    session.add(team)
    session.commit()
    
    return team

@mutation.field("deleteTeam")
@convert_kwargs_to_snake_case
def resolve_delete_team(obj, info, id):
    '''GraphQL mutation to delete a Team
        :param id: UUID of Team to be deleted
        :returns: UUID of deleted Team
    '''
    
    session = info.context['dbsession']
    session.query(Team).filter(Team.id == id).delete()
    session.commit()
    
    return id


@mutation.field("createProgram")
@convert_kwargs_to_snake_case
def resolve_create_program(obj, info, input):
    '''GraphQL mutation to create a Program.
        :param input: params for new Program
        :returns: Program object
    '''
    session = info.context['dbsession']
    datasets = input.pop('datasets', [])
    targets = input.pop('targets', [])
    tags = input.pop('tags', [])
    if 'description' not in input:
        input['description'] = ''
    
    program = Program(**input)
    program.datasets = [session.merge(Dataset(**dataset)) for dataset in datasets]
    program.tags = [session.merge(Tag(**tag)) for tag in tags]

    for target_dict in targets:
        cv_dict = target_dict.pop('category_value')
        cat_dict = cv_dict.pop('category')
        cv = session.merge(CategoryValue(**cv_dict))
        cv.category_id = cat_dict['id']
        target = Target(target_date=func.now(), category_value=cv, **target_dict)
        program.targets.append(target)

    session.add(program)
    session.commit()
    
    return program


@mutation.field("updateProgram")
@convert_kwargs_to_snake_case
def resolve_update_program(obj, info, input):
    '''GraphQL mutation to update a Program.
        :param input: params for updated Program
        :returns: Updated Program dictionary
    '''
    session = info.context['dbsession']
    program = session.query(Program).get(input.pop('id'))
    
    if 'team_id' in input:
        program.team = session.merge(Team(id=input.pop('team_id')))

    if 'targets' in input:
        program.targets = []
        # TODO: We want to keep a record of all changes to targets so we can
        # view changes over time.
        # The actual update procedure should be a little more complicated:
        #  1) Find existing target with the same category_value
        #  2) If the target % hasn't changed, keep it intact
        #  3) If the target did change, mark the old as `deleted` and create
        #     a new Target with the new %
        #  4) Make sure that the old target keeps the program_id even though
        #     it is not active. This can be configured in the relationship join
        #     parameters in the database objects.
        for target_dict in input.pop('targets'):
            cv_dict = target_dict.pop('category_value', None)
            target = session.merge(Target(**target_dict))
            if cv_dict:
                cat_dict = cv_dict.pop('category')
                cv = session.merge(CategoryValue(**cv_dict))
                cv.category_id = cat_dict['id']
                target.category_value = cv
            program.targets.append(target)

    if 'datasets' in input:
        program.datasets = []
        for ds_dict in input.pop('datasets'):
            if 'id' in ds_dict:
                ds_dict['id'] = uuid.UUID(ds_dict['id'])
            program.datasets.append(session.merge(Dataset(**ds_dict)))

    if 'tags' in input:
        program.tags = []
        for tag_dict in input.pop('tags'):
            if 'id' in tag_dict:
                tag_dict['id'] = uuid.UUID(tag_dict['id'])
            elif 'tag_type' not in tag_dict:
                tag_dict['tag_type'] = 'custom'
            program.tags.append(session.merge(Tag(**tag_dict)))

    for key, value in input.items():
        setattr(program, key, value)
    
    session.merge(program)
    session.commit()
    return program


@mutation.field("deleteProgram")
def resolve_delete_program(obj, info, id):
    '''GraphQL mutation to delete a Program.
        :param id: UUID of Program to be deleted
        :returns: UUID of deleted Program
    '''
    session = info.context['dbsession']
    program = Program.get_not_deleted(session, id)
    if program is not None:
        program.soft_delete(session)
    session.commit()

    return id


@mutation.field("restoreProgram")
def resolve_restore_program(obj, info, id):
    '''GraphQL mutation to restore a deleted Program.
        :param id: UUID of Program to be restored
        :returns: Program object
    '''
    session = info.context['dbsession']
    program = session.query(Program).get(id)
    if program:
        program.deleted = None
        session.merge(program)
    session.commit()

    return program
