from ariadne import convert_kwargs_to_snake_case, ObjectType

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
        :returns: 
    '''
    payload = {
        "dataset": {
            "id": 1004
        }   
    }
    return payload
