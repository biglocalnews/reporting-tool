import datetime
from ariadne import convert_kwargs_to_snake_case, ObjectType
from settings import settings
from database import SessionLocal, User, Dataset, Tag, Program, Record, Entry
from sqlalchemy.orm import joinedload

mutation = ObjectType("Mutation")

'''GraphQL query defaults
    :param obj: obj is a value returned by a parent resolver
    :param info: Has context attribute that contains ContextValue specific to the server implementation.
'''

@mutation.field("createDataset")
@convert_kwargs_to_snake_case
def resolve_create_dataset(obj, info, input):
    '''GraphQL query to create a Dataset.
        :param input: Params to be changed 
        :returns: Dataset dictionary
    '''
    session = info.context['dbsession']

    program = session.query(Program).get(input['program_id'])

    tags = []
    all_tags = input.pop('tags', [])

    for tag in all_tags:
        new_tag = Tag(**tag)
        tags.append(new_tag)

    dataset = Dataset(tags=tags, **input)
    session.add(dataset)
    session.commit()

    return dataset

@mutation.field("deleteDataset")
def resolve_delete_dataset(obj, info, id):
    '''GraphQL mutation to soft delete a Dataset.
        :param id: UUID of Dataset to be soft deleted
        :returns: UUID of soft deleted Dataset
    '''
    session = info.context['dbsession']
    session.query(Dataset).filter(Dataset.id == id).update({'deleted':datetime.datetime.now()})
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

    entries = []
    all_entries = input.pop('entries', [])

    for entry in all_entries:
        new_entry = Entry(**entry)
        entries.append(new_entry)

    record = Record(entries=entries, **input)
    session.add(record)
    session.commit()

    return record

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
    '''GraphQL mutation to soft delete a Record.
        :param id: UUID of Record to be soft deleted
        :returns: UUID of soft deleted Record
    '''
    session = info.context['dbsession']
    session.query(Record).filter(Record.id == id).update({'deleted':datetime.datetime.now()})
    session.commit()

    return id