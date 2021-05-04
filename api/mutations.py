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

@mutation.field("updateDataset")
@convert_kwargs_to_snake_case
def resolve_update_dataset(obj, info, input):
    '''GraphQL mutation to update a Dataset.
        :param input: Params to be changed
        :returns: Updated Dataset
    '''
    session = info.context['dbsession']
    dataset = session.query(Dataset).get(input['id'])

    tags = []
    all_tags = input.pop('tags', [])

    for tag in all_tags:
        incoming_tag = Tag(**tag)
        tags.append(incoming_tag)
        merged_tag = session.merge(incoming_tag)
        
    for param in input:
        setattr(dataset, param, input[param])

    session.add(dataset)
    session.commit()

    return dataset 

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

# Handle create or update for associated Entries
    session = info.context['dbsession']
    record = session.query(Record).get(input['id'])

    entries = []
    all_entries = input.pop('entries', [])

    for entry in all_entries:        
        incoming_entry = Entry(**entry)
        entries.append(incoming_entry)
        merged_object = session.merge(incoming_entry)

    for param in input:
        setattr(record, param, input[param])

    session.add(record)
    session.commit()

    return record 

# Handle Update exclusively 
    # session = info.context['dbsession']
    
    # entries = []
    # all_entries = input.pop('entries', [])

    # for entry in all_entries:    
    #     session.query(Entry).filter(Entry.id == entry["id"]).update(entry)

    # update_record = session.query(Record).filter(Record.id == input["id"]).update(input)
    # session.commit()

    # record = session.query(Record).get(input['id'])

    # return record

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