from ariadne import convert_kwargs_to_snake_case, ObjectType
from database import Dataset, User

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
        :returns: User dictionary
    '''
    session = info.context['dbsession']
    retrieved_user = session.query(User).filter(User.id == id).first()

    return retrieved_user

@query.field("dataset")
@convert_kwargs_to_snake_case
def resolve_dataset(obj, info, id):
    '''GraphQL query to find a dataset based on dataset ID.
        :param id: Id for the dataset to be fetched
        :returns: Dataset dictionary
    '''
    session = info.context['dbsession']
    retrieved_dataset = session.query(Dataset).filter(Dataset.id == id).first()

    return retrieved_dataset

