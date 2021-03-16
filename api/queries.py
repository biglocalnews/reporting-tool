from ariadne import convert_kwargs_to_snake_case, ObjectType

query = ObjectType("Query")

@query.field("user")
@convert_kwargs_to_snake_case
def resolve_user(obj, info, user_id):
    '''GraphQL query to find a user based on user ID.
        :param obj: Describe what obj is
        :param info: Describe what info is
        :param user_id: The user's ID
        :returns: Whatever payload is
    '''
    payload = {
        'id': 1,
        'first_name': 'Cat',
        'last_name': 'Berry',
    }

    return payload