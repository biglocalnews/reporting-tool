from ariadne import convert_kwargs_to_snake_case, ObjectType

query = ObjectType("Query")

@query.field("user")
@convert_kwargs_to_snake_case
def resolve_user(obj, info, id):
    '''GraphQL query to find a user based on user ID.
        :param obj: obj is a value returned by a parent resolver
        :param info: Has context attribute that contains ContextValue specific to the server implementation.
        :param id: Id for the user to be fetched
        :returns: 
    '''
    payload = {
        'id': 1,
        'first_name': 'Cat',
        'last_name': 'Berry',
    }

    return payload