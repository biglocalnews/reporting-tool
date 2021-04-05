import datetime
from ariadne import convert_kwargs_to_snake_case, ObjectType
from settings import settings
from database import SessionLocal, User, Dataset

session = SessionLocal()
mutation = ObjectType("Mutation")

@convert_kwargs_to_snake_case
@mutation.field("upsertUser")
def resolve_upsert_user(obj, info, input):
    '''GraphQL query to upsert a user.
        :param obj: obj is a value returned by a parent resolver
        :param info: Has context attribute that contains ContextValue specific to the server implementation.
        :param input: Params to be changed
        :returns: 
    '''
    payload = {
        "user": {
            "id": 7  
        }
    }
    return payload

@convert_kwargs_to_snake_case
@mutation.field("deleteUser")
def resolve_delete_user(obj, info, id):
    '''GraphQL query to upsert a user.
        :param obj: obj is a value returned by a parent resolver
        :param info: Has context attribute that contains ContextValue specific to the server implementation.
        :param id: Id for the user to be deleted 
        :returns: 
    '''
    payload = {
        "id": 1001   
    }
    return payload

@convert_kwargs_to_snake_case
@mutation.field("createDataset")
def resolve_create_dataset(obj, info, input):
    '''GraphQL query to add dataset.
        :param obj: obj is a value returned by a parent resolver
        :param info: Has context attribute that contains ContextValue specific to the server implementation.
        :param input: Dataset to be created
        :returns: Created Dataset
    # '''
    clean_input = {
        "name": input["name"],
        "description": input["description"],
        "program_id": input["program_id"],
        "inputter_id": input["inputter_id"]
    }

    print(f'{input} input')
    dataset = Dataset(clean_input)
    session.add(dataset)
    session.commit()

    flushed_dataset = session.query(Dataset).filter_by(name='dummy').first()
    print(f'{flushed_dataset.name} love')

    # payload = {
    #     "id": 1004,
    #     "name": "Bob",
    #     "description": "Jeans",
    #     "programId": 1 
    # }
    return flushed_dataset
