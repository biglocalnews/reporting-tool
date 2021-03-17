from ariadne import convert_kwargs_to_snake_case, ObjectType

mutation = ObjectType("Mutation")

@mutation.field("upsertUser")
@convert_kwargs_to_snake_case
def resolve_upsert_user(obj, info, input):
    payload = {
        id: 7  
    }
    return payload

@mutation.field("deleteUser")
@convert_kwargs_to_snake_case
def resolve_delete_user(obj, info, id):
    payload = {
        id: 1001   
    }
    return payload