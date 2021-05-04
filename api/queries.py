from ariadne import convert_kwargs_to_snake_case, ObjectType
from database import Dataset, User, Record

query = ObjectType("Query")

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
    retrieved_user = session.query(User).filter(User.id == id, "deleted" == None).first()

    return retrieved_user

@query.field("dataset")
@convert_kwargs_to_snake_case
def resolve_dataset(obj, info, id):
    '''GraphQL query to find a dataset based on dataset ID.
        :param id: Id for the dataset to be fetched
        :returns: Dataset dictionary OR None if Dataset was soft-deleted
    '''
    session = info.context['dbsession']
    dataset = session.query(Dataset).filter(Dataset.id == id, "deleted" == None).first()

    return dataset

@query.field("record")
def resolve_record(obj, info, id):
    '''GraphQL query to find a Record based on Record ID.
        :param id: Id for the Record to be fetched 
        :returns: Record dictionary OR None if Record was soft-deleted
    '''
    session = info.context['dbsession']
    record = session.query(Record).filter(Record.id == id, "deleted" == None).first()
    return record