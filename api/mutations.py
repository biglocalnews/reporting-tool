import datetime
import uuid
from ariadne import convert_kwargs_to_snake_case, ObjectType
from settings import settings
from database import SessionLocal, User, Dataset, Tag, Program

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
        :returns: 
    '''

    #TODO figure out how to eager load associated tags with flushed_dataset and return with payload! 
    #TODO check docs- more efficient syntax to handle loading associated programs?

    print(f'{input} input')

    dataset_input = {
        "name": input["name"],
        "description": input["description"],
        "program_id": input["programId"],
        "inputter_id": '3dd10e5f-be57-435c-b721-28f3ced5dc89',
    }

    print(f'{dataset_input} clean_input')
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
        print(f'{tag_input} tag_input')
        tag = Tag(**tag_input)
        session.add(tag)
        session.commit()

    return dataset
