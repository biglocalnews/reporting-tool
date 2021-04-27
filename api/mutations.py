import datetime
import uuid
from ariadne import convert_kwargs_to_snake_case, ObjectType
from settings import settings
from database import SessionLocal, User, Dataset, Tag, Program, Record
from sqlalchemy.orm import joinedload

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
    session = SessionLocal()

    dataset_input = {
        "name": input["name"],
        "description": input["description"],
        "program_id": input["programId"],
        "inputter_id": input["inputterId"],
    }

    dataset = Dataset(**dataset_input)
    session.add(dataset)

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
    persisted_dataset["tags"] = [tag.__dict__ for tag in persisted_dataset['tags']]
    session.close()

    return persisted_dataset

@convert_kwargs_to_snake_case
@mutation.field("deleteDataset")
def resolve_delete_dataset(obj, info, id):
    '''GraphQL mutation to delete a dataset.
        :param id: UUID of Dataset to be deleted
        :returns: UUID of deleted Dataset
    '''
    session = info.context['dbsession']
    session.query(Dataset).filter(Dataset.id == id).delete()
    session.commit()

    return id

@convert_kwargs_to_snake_case
@mutation.field("updateDataset")
def resolve_update_dataset(obj, info, input):
    '''GraphQL mutation to update a Dataset.
        :param input: Params to be changed
        :returns: Updated Dataset
    '''
    session = info.context['dbsession']
    dataset = session.query(Dataset).filter(Dataset.id == input["id"]).first()

    # removing tags from input, and returning the contents of tags OR an empty array if tags was not found.
    tags = input.pop('tags', [])

    # iterating over tags to check if the included tag exists or should be created.
    for tag in tags:
        existing_tag = session.query(Tag).filter(Tag.name == tag["name"].capitalize().strip()).one_or_none()
        
        if existing_tag:
            dataset.tags.append(existing_tag)
        else: 
            tag_input = {
                "name": tag["name"],
                "description": tag["description"],
                "tag_type": tag["tagType"],
            }
            new_tag = Tag(**tag_input)
            dataset.tags.append(new_tag)

    # Iterate through remaining input params and update atributes on Dataset 
    for param in input:
        setattr(dataset, param, input[param])

    session.add(dataset)
    session.commit()

    updated_dataset = session.query(Dataset).filter(Dataset.id == input["id"]).first()

    return updated_dataset 

@convert_kwargs_to_snake_case
@mutation.field("createRecord")
def resolve_delete_dataset(obj, info, input):
    '''GraphQL mutation to create a Record.
        :param input: params for new Record
        :returns: Record dictionary
    '''

    print(f'{input}, checking my input here')

    session = info.context['dbsession']

    record_input = {
        "dataset_id": input["datasetId"],
        "publication_date": input["publicationDate"]
    }

    # TODO Add handling for associated DataInputs 
    record = Record(**record_input)
    session.add(record)

    session.commit()

    persisted_record = session.query(Record).filter(Record.id == record.id).first()

    return persisted_record

@convert_kwargs_to_snake_case
@mutation.field("deleteRecord")
def resolve_delete_dataset(obj, info, id):
    '''GraphQL mutation to delete a Record.
        :param id: UUID of Record to be deleted
        :returns: UUID of deleted Record
    '''
    session = info.context['dbsession']
    session.query(Record).filter(Record.id == id).delete()
    session.commit()

    return id