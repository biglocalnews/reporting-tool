from ariadne import convert_kwargs_to_snake_case, ObjectType
from sqlalchemy.sql.expression import func
from database import Dataset, User, Record, Category, CategoryValue
from sqlalchemy.orm.exc import NoResultFound

query = ObjectType("Query")
dataset = ObjectType("Dataset")

queries = [query, dataset]

'''GraphQL query to find a user based on user ID.
    :param obj: obj is a value returned by a parent resolver
    :param info: Has context attribute that contains ContextValue specific to the server implementation.
'''

@query.field("user")
@convert_kwargs_to_snake_case
def resolve_user(obj, info, id):
    '''GraphQL query to find a user based on user ID.
        :param id: Id for the user to be fetched
        :returns: User dictionary OR None if User was soft-deleted
    '''
    session = info.context['dbsession']
    user = session.query(User).filter(User.id == id, User.deleted == None).first()

    return user

@query.field("dataset")
@convert_kwargs_to_snake_case
def resolve_dataset(obj, info, id):
    '''GraphQL query to find a dataset based on dataset ID.
        :param id: Id for the dataset to be fetched
        :returns: Dataset dictionary OR None if Dataset was soft-deleted
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


@query.field("record")
def resolve_record(obj, info, id):
    '''GraphQL query to find a Record based on Record ID.
        :param id: Id for the Record to be fetched 
        :returns: Record dictionary OR None if Record was soft-deleted
    '''
    session = info.context['dbsession']
    record = session.query(Record).filter(Record.id == id, Record.deleted == None).first()
    return record

@query.field("category")
def resolve_category(obj, info, id):
    '''GraphQL query to find a Category based on Category ID.
        :param id: Id for the Category to be fetched 
        :returns: Category dictionary OR None if Category was soft-deleted
    '''
    session = info.context['dbsession']
    category = session.query(Category).filter(Category.id == id, Category.deleted == None).first()
    
    return category

@query.field("categoryValue")
def resolve_category_value(obj, info, id):
    '''GraphQL query to find a CategoryValue based on CategoryValue ID.
        :param id: Id for the CategoryValue to be fetched 
        :returns: CategoryValue dictionary OR None if CategoryValue was deleted
    '''
    session = info.context['dbsession']
    category_value = session.query(CategoryValue).get(id)
    
    return category_value