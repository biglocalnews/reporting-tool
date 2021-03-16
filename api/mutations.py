from ariadne import convert_kwargs_to_snake_case, ObjectType

mutation = ObjectType("Mutation")
@mutation.field("upsertUser")

@convert_kwargs_to_snake_case

def resolve_upsert_user(obj, info, first_name, last_name):
    payload = {
        'user': {
            "id": 1,
            "first_name": "Straw",
            "last_name": "Berry"
        },
        'success': 1    
    }
    return payload