from ariadne import convert_kwargs_to_snake_case, ObjectType

query = ObjectType("Query")
@query.field("users")

@convert_kwargs_to_snake_case

def resolve_users(obj, info):
    payload = {
        'users': [{
            'id': 1,
            'first_name': 'Cat',
            'last_name': 'Berry'
        }],    
        'success': 1
    }
    return payload
