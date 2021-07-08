from ariadne import convert_kwargs_to_snake_case, ObjectType
from sqlalchemy.sql.expression import func
from database import Dataset, User, Record, Category, CategoryValue, Program, Entry, Team, Role
from sqlalchemy.orm.exc import NoResultFound

query = ObjectType("Query")
dataset = ObjectType("Dataset")
user = ObjectType("User")
sum_entries_by_category_value = ObjectType("SumEntriesByCategoryValue")

queries = [query, dataset, user, sum_entries_by_category_value]

'''GraphQL query to find a user based on user ID.
    :param obj: obj is a value returned by a parent resolver
    :param info: Has context attribute that contains ContextValue specific to the server implementation.
'''

@query.field("user")
@convert_kwargs_to_snake_case
def resolve_user(obj, info, id):
    '''GraphQL query to find a user based on user ID.
        :param id: Id for the user to be fetched
        :returns: User OR None if User was soft-deleted
    '''
    session = info.context['dbsession']
    user = session.query(User).filter(User.id == id).first()
    return user

@user.field("active")
def resolve_user_active(user, info):
    '''Field indicating whether user is currently active.'''
    return user.deleted is None

@query.field("users")
@convert_kwargs_to_snake_case
def resolve_users(obj, info):
    '''GraphQL query to fetch list of all users.
    :returns: List of all users
    '''
    session = info.context['dbsession']
    return session.query(User).order_by(User.email.asc()).all()

@query.field("program")
@convert_kwargs_to_snake_case
def resolve_program(obj, info, id):
    '''GraphQL query to find a Program based on Program ID.
        :param id: Id for the Program to be fetched
        :returns: Program 
    '''
    session = info.context['dbsession']
    program = Program.get_not_deleted(session, id)
    return program

@query.field("dataset")
@convert_kwargs_to_snake_case
def resolve_dataset(obj, info, id):
    '''GraphQL query to find a dataset based on dataset ID.
        :param id: Id for the dataset to be fetched
        :returns: Dataset OR None if Dataset was soft-deleted
    '''
    session = info.context['dbsession']
    dataset = Dataset.get_not_deleted(session, id)
    return dataset

@dataset.field("lastUpdated")
@convert_kwargs_to_snake_case
def resolve_dataset_last_updated(dataset, info):
    '''GraphQL query to find the date a dataset was last updated.
        :param dataset: Dataset object to filter by its ID
        :returns: Datetime scalar
    '''
    session = info.context['dbsession']
    return session.query(func.max(Record.updated)).\
            filter(Record.dataset_id == dataset.id, Record.deleted == None).\
                scalar()

# TODO: We may want to move the dataset/category relationship resolvers in the future
# to the statement in the following fuction so we can limit the number of queries
# run per object and avoid N+1 query problem. 
# Consider batch queries: https://github.com/graphql/dataloader 
@dataset.field("sumOfCategoryValueCounts")
def resolve_sums_of_category_values(dataset, info):
    '''GraphQL query to sum the counts in an entry by category value
        :param dataset: Dataset object to filter records by dataset ID
        :returns: Dictionary
    '''
    session = info.context['dbsession']

    stmt = session.query(Entry.category_value_id, func.sum(Entry.count).label('sum_of_counts')).\
        join(Entry.record).filter(Record.dataset_id == dataset.id, Record.deleted == None).group_by(Entry.category_value_id).all()

    return [{'dataset_id': dataset.id, 'category_value_id': row[0], 'sum_of_counts': row[1]} for row in stmt]


@sum_entries_by_category_value.field("dataset")
def resolve_sums_dataset_relationship(count_obj, info):
    '''GraphQL query to add dataset relationship to SumEntriesByCategoryValue
        :param count_obj: Object in sumOfCategoryValueCounts dataset field array
        :returns: Dataset dictionary OR None if Dataset was soft-deleted
    '''
    session = info.context['dbsession']
    dataset_rel = Dataset.get_not_deleted(session, count_obj['dataset_id'])
    return dataset_rel


@sum_entries_by_category_value.field("categoryValue")
def resolve_sums_category_relationship(count_obj, info):
    '''GraphQL query to add category relationship to SumEntriesByCategoryValue
        :param count_obj: Object in sumOfCategoryValueCounts dataset field array
        :returns: Category dictionary OR None if Category was soft-deleted
    '''
    session = info.context['dbsession']
    category_value_rel = CategoryValue.get_not_deleted(session, count_obj['category_value_id'])
    return category_value_rel

@query.field("record")
def resolve_record(obj, info, id):
    '''GraphQL query to find a Record based on Record ID.
        :param id: Id for the Record to be fetched 
        :returns: Record OR None if Record was soft-deleted
    '''
    session = info.context['dbsession']
    record = Record.get_not_deleted(session, id)
    return record

@query.field("category")
def resolve_category(obj, info, id):
    '''GraphQL query to find a Category based on Category ID.
        :param id: Id for the Category to be fetched 
        :returns: Category OR None if Category was soft-deleted
    '''
    session = info.context['dbsession']
    category = Category.get_not_deleted(session, id)
    return category

@query.field("categoryValue")
def resolve_category_value(obj, info, id):
    '''GraphQL query to find a CategoryValue based on CategoryValue ID.
        :param id: Id for the CategoryValue to be fetched 
        :returns: CategoryValue OR None if CategoryValue was deleted
    '''
    session = info.context['dbsession']
    category_value = CategoryValue.get_not_deleted(session, id)
    return category_value

@query.field("team")
def resolve_team(obj, info, id):
    '''GraphQL query to find a Team based on Team ID.
        :param id: Id for the Team to be fetched 
        :returns: Team object 
    '''
    session = info.context['dbsession']
    team = session.query(Team).get(id)
    
    return team


@query.field("teams")
def resolve_teams(obj, info):
    '''GraphQL query to fetch full list of teams.
    :returns: List of team objects
    '''
    session = info.context['dbsession']
    return session.query(Team).filter(Team.deleted == None).order_by(Team.name.asc()).all()


@query.field("roles")
def resolve_roles(obj, info):
    '''GraphQL query to fetch full list of roles.
    :returns: List of role objects
    '''
    session = info.context['dbsession']
    return session.query(Role).filter(Role.deleted == None).order_by(Role.name.asc()).all()

