from ariadne import convert_kwargs_to_snake_case, ObjectType

query = ObjectType("Query")

@query.field("user")
@convert_kwargs_to_snake_case
def resolve_user(obj, info, user_id):
    payload = {
        'id': 1,
        'first_name': 'Cat',
        'last_name': 'Berry',
    }

    return payload