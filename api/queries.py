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

@query.field("teamUsers")
@convert_kwargs_to_snake_case
def resolve_teamUsers(obj, info, team_id):
    payload = [{
        'id': 3,
        'first_name': 'Little',
        'last_name': 'Berry Team!!'
    },
    {
        'id': 4,
        'first_name': 'Cherry',
        'last_name': 'Berry!'
    }]
    
    return payload

@query.field("programUsers")
@convert_kwargs_to_snake_case
def resolve_programUsers(obj, info, program_id):
    payload = [{
        'id': 5,
        'first_name': 'Cheery',
        'last_name': 'Berry- Program!'
    },
    {
        'id': 6,
        'first_name': 'Blue',
        'last_name': 'Berry!'
    }]

    return payload
