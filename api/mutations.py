import datetime
from ariadne import convert_kwargs_to_snake_case, ObjectType
from settings import settings
from database import SessionLocal, User, Dataset, Tag, Program, Record, Entry, Category, Target, Value
from sqlalchemy.orm import joinedload
from sqlalchemy.orm.exc import NoResultFound

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

    all_tags = input.pop('tags', [])
    tags = []

    for tag in all_tags:
        existing_tag = session.query(Tag).filter(Tag.name == tag["name"].capitalize().strip()).first()

        if existing_tag:
            tags.append(existing_tag)
        else: 
            new_tag = Tag(**tag)
            tags.append(new_tag)
            session.add(new_tag)

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
    session.query(Record).filter(Record.dataset_id == id).update({'deleted':datetime.datetime.now()})

    related_records = session.query(Record).filter(Record.dataset_id == id).all()
    for record in related_records:
        session.query(Entry).filter(Entry.record_id == record.id).update({'deleted':datetime.datetime.now()})
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
        existing_tag = session.query(Tag).filter(Tag.name == tag["name"].capitalize().strip()).first()

        if existing_tag:
            dataset.tags.append(existing_tag)
        else: 
            new_tag = Tag(**tag)
            dataset.tags.append(new_tag)
            session.add(new_tag)
   
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

    all_entries = input.pop('entries', [])
    n_entries = []

    for entry in all_entries:  
        value = session.query(Value).get(entry['value_id'])
        n_entries.append(Entry(value=value, **entry))

    record = Record(entries=n_entries, **input)
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
    record = session.query(Record).get(input['id'])

    all_entries = input.pop('entries', [])

    for entry in all_entries:  
        existing_entry = session.query(Entry).get(entry.get('id'))
        
        if existing_entry:
            if str(existing_entry.record_id) == input['id']:
                session.merge(Entry(**entry))
            else:   
                raise NoResultFound(f'No Entry with id: {existing_entry.id} associated with Record id: {record.id} was found.')
        else:
            Entry(record=record, **entry)

    for param in input:
        setattr(record, param, input[param])

    session.add(record)
    session.commit()

    return record 

@mutation.field("deleteRecord")
def resolve_delete_record(obj, info, id):
    '''GraphQL mutation to soft delete a Record.
        :param id: UUID of Record to be soft deleted
        :returns: UUID of soft deleted Record
    '''
    session = info.context['dbsession']
    session.query(Record).filter(Record.id == id).delete()
    session.commit()

    return id

@mutation.field("createCategory")
@convert_kwargs_to_snake_case
def resolve_create_category(obj, info, input):
    '''GraphQL mutation to create a Category.
        :param input: params for new Category
        :returns: Category dictionary
    '''

    session = info.context['dbsession']
    existing_category = session.query(Category).filter(Category.name == input["name"].capitalize().strip()).first()

    if existing_category:
        return existing_category
    else:    
        category = Category(**input)
        session.add(category)
        session.commit()
    
    return category

@mutation.field("updateCategory")
@convert_kwargs_to_snake_case
def resolve_update_category(obj, info, input):
    '''GraphQL mutation to update a Category
        :param input: Params to be changed
        :returns: Updated Category
    '''

    session = info.context['dbsession']
    category = session.query(Category).get(input['id'])

    for param in input:
        setattr(category, param, input[param])

    session.add(category)
    session.commit()
    
    return category

@mutation.field("deleteCategory")
def resolve_delete_category(obj, info, id):
    '''GraphQL mutation to soft delete a Category.
        :param id: UUID of Category to be soft deleted
        :returns: UUID of soft deleted Category
    '''
    session = info.context['dbsession']

    session.query(Category).filter(Category.id == id).update({'deleted':datetime.datetime.now()})
    session.query(Value).filter(Value.category_id == id).update({'deleted':datetime.datetime.now()})

    session.commit()

    return id

@mutation.field("createValue")
@convert_kwargs_to_snake_case
def resolve_create_value(obj, info, input):
    '''GraphQL mutation to create a Value.
        :param input: params for new Value
        :returns: Value dictionary
    '''

    session = info.context['dbsession']

    value = Value(**input)
    session.add(value)
    session.commit()
    
    return value

@mutation.field("updateValue")
@convert_kwargs_to_snake_case
def resolve_update_value(obj, info, input):
    '''GraphQL mutation to update a Value.
        :param input: params to be changed
        :returns: updated Value dictionary
    '''
    
    session = info.context['dbsession']
    value = session.query(Value).get(input['id'])

    for param in input:
        setattr(value, param, input[param])

    session.add(value)
    session.commit()
    
    return value

@mutation.field("deleteValue")
def resolve_delete_value(obj, info, id):
    '''GraphQL mutation to delete a Value.
        :param id: UUID of Value to be deleted
        :returns: UUID of deleted Value
    '''
    session = info.context['dbsession']

    session.query(Value).filter(Value.id == id).update({'deleted':datetime.datetime.now()})
    session.query(Entry).filter(Entry.value_id == id).update({'deleted':datetime.datetime.now()})
    session.query(Target).filter(Target.value_id == id).update({'deleted':datetime.datetime.now()})
    
    session.commit()

    return id