import datetime
import uuid
from ariadne import convert_kwargs_to_snake_case, ObjectType
from settings import settings
from database import SessionLocal, User, Dataset, Tag, Program
from sqlalchemy.orm import joinedload

session = SessionLocal()
mutation = ObjectType("Mutation")

'''GraphQL query defaults
    :param obj: obj is a value returned by a parent resolver
    :param info: Has context attribute that contains ContextValue specific to the server implementation.
'''

@convert_kwargs_to_snake_case
@mutation.field("upsertUser")
def resolve_upsert_user(obj, info, input):
    '''GraphQL query to upsert a user.
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
    '''GraphQL query to delete a user.
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
    '''GraphQL query to create a dataset.
        :param id: Params to be changed 
        :returns: Newly created Dataset dictionary with eager-loaded associated Tags
    '''
    #TODO Flush vs Commits??
    #TODO check docs- more efficient syntax to handle loading associated programs?
    #TODO check docs- is there a fancy decorator to handle automatic snakecase mapping of inputs?

    dataset_input = {
        "name": input["name"],
        "description": input["description"],
        "program_id": input["programId"],
        "inputter_id": '3dd10e5f-be57-435c-b721-28f3ced5dc89',
    }

    dataset = Dataset(**dataset_input)
    session.add(dataset)
    session.commit()

    program = session.query(Program).filter(Program.id == input["programId"]).first()

    tags = [tag for tag in input["tags"]]
    for tag in tags:
        tag_input = {
            "name": tag["name"],
            "description": tag["description"],
            "tag_type": tag["tagType"],
            "programs": [program],
            "datasets": [dataset]
        }
        tag = Tag(**tag_input)
        session.add(tag)
    session.commit()

    persisted_dataset = session.query(Dataset).filter(Dataset.id == dataset.id).options(joinedload("tags")).first().__dict__
    persisted_dataset["tags"] = map(lambda tag: tag.__dict__, persisted_dataset["tags"])

    return persisted_dataset
