import datetime
import uuid
import re
from ariadne import convert_kwargs_to_snake_case, ObjectType
from settings import settings
from database import SessionLocal, User, Dataset, Tag, Program, Record, Entry
from sqlalchemy.orm import joinedload

mutation = ObjectType("Mutation")

'''GraphQL query defaults
    :param obj: obj is a value returned by a parent resolver
    :param info: Has context attribute that contains ContextValue specific to the server implementation.
'''

@convert_kwargs_to_snake_case
@mutation.field("createDataset")
def resolve_create_dataset(obj, info, input):
    '''GraphQL query to create a dataset.
        :param id: Params to be changed 
        :returns: Newly created Dataset dictionary with eager-loaded associated Tags
    '''
    session = info.context['dbsession']

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

    persisted_dataset = session.query(Dataset).filter(Dataset.id == dataset.id).first()

    return persisted_dataset

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

@mutation.field("createRecord")
@convert_kwargs_to_snake_case
def resolve_create_record(obj, info, input):
    '''GraphQL mutation to create a Record.
        :param input: params for new Record
        :returns: Record dictionary
    '''

    session = info.context['dbsession']

    record_input = {
        "dataset_id": input["dataset_id"],
        "publication_date": input["publication_date"]
    }

    record = Record(**record_input)
    session.add(record)
    session.commit()

    all_entries = input.get('entries', [])
    for entry in all_entries:
        n_entry = Entry()
        for param in entry:
            setattr(n_entry, param, entry[param])
        n_entry.record = record
        merged_object = session.merge(n_entry)

    session.commit()

    persisted_record = session.query(Record).filter(Record.id == record.id).first()

    return persisted_record

@mutation.field("updateRecord")
@convert_kwargs_to_snake_case
def resolve_update_record(obj, info, input):
    '''GraphQL mutation to update a Record.
        :param input: params to update Record
        :returns: Record dictionary
    '''

    session = info.context['dbsession']
    record = session.query(Record).filter(Record.id == input["id"]).first()

    all_entries = input.pop('entries', [])
    for single_entry in all_entries:
        n_entry = Entry()
        for param in single_entry:
           setattr(n_entry, param, single_entry[param])
        merged_object = session.merge(n_entry)

    for param in input:
        setattr(record, param, input[param])

    session.add(record)
    session.commit()

    updated_record = session.query(Record).filter(Record.id == input["id"]).first()

    return updated_record 

@mutation.field("deleteRecord")
def resolve_delete_record(obj, info, id):
    '''GraphQL mutation to delete a Record.
        :param id: UUID of Record to be deleted
        :returns: UUID of deleted Record
    '''
    session = info.context['dbsession']
    session.query(Record).filter(Record.id == id).delete()
    session.commit()

    return id