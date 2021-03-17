from ariadne import convert_kwargs_to_snake_case, ObjectType

mutation = ObjectType("Mutation")

@mutation.field("upsertUser")
@convert_kwargs_to_snake_case
def resolve_upsert_user(obj, info, input):
    '''GraphQL query to upsert a user.
        :param obj: obj is a value returned by a parent resolver
        :param info: Has context attribute that contains ContextValue specific to the server implementation.
        :param input: Params to be changed
        :returns: 
    '''
    payload = {
        id: 7  
    }
    return payload

@mutation.field("deleteUser")
@convert_kwargs_to_snake_case
def resolve_delete_user(obj, info, id):
    '''GraphQL query to upsert a user.
        :param obj: obj is a value returned by a parent resolver
        :param info: Has context attribute that contains ContextValue specific to the server implementation.
        :param id: Id for the user to be deleted 
        :returns: 
    '''
    payload = {
        id: 1001   
    }
    return payload