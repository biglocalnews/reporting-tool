from ariadne import convert_kwargs_to_snake_case, ObjectType
from database import SessionLocal, Dataset, Tag, User
from sqlalchemy.orm import joinedload

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
        :returns: User dictionary with eager-loaded Role(s) and associated Team(s)
    '''
    session = info.context['dbsession']
    retrieved_user = session.query(User).filter(User.id == id).first()

    return retrieved_user

@query.field("dataset")
@convert_kwargs_to_snake_case
def resolve_dataset(obj, info, id):
    '''GraphQL query to find a dataset based on dataset ID.
        :param id: Id for the dataset to be fetched
        :returns: Dataset dictionary with eager-loaded associated Tags and Records
    '''
    session = SessionLocal()

    retrieved_dataset = session.query(Dataset).filter(Dataset.id == id).options(joinedload("tags"), joinedload("records")).first().__dict__
    retrieved_dataset["records"] = [record.__dict__ for record in retrieved_dataset['records']]
    retrieved_dataset["tags"] = [tag.__dict__ for tag in retrieved_dataset['tags']]

    session.close()

    return retrieved_dataset
