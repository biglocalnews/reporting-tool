from ariadne import convert_kwargs_to_snake_case, ObjectType
from database import SessionLocal, Dataset, Tag, User
from sqlalchemy.orm import joinedload

query = ObjectType("Query")

'''GraphQL query to find a user based on user ID.
    :param obj: obj is a value returned by a parent resolver
    :param info: Has context attribute that contains ContextValue specific to the server implementation.
'''

@query.field("user")
@convert_kwargs_to_snake_case
def resolve_user(obj, info, id):
    '''GraphQL query to find a user based on user ID.
        :param id: Id for the user to be fetched
        :returns: User dictionary with eager-loaded Role(s) and associated Team(s)
    '''
    session = SessionLocal()

    retrieved_user = session.query(User).filter(User.id == id).options(joinedload("roles"), joinedload("teams").joinedload("programs").joinedload("datasets").joinedload("records")).first().__dict__

    print(f'{retrieved_user}, checking user')

    # retrieved_user["roles"] = [role.__dict__ for role in retrieved_user["roles"]]

    # TODO Abstract out into a map for clarity and to handle iterating over each team and subsequent program
    # retrieved_user["teams"] = [team.__dict__ for team in retrieved_user["teams"]]

    # this below will not work bc ["teams"] is an array
    # retrieved_user["teams"]["programs"] = [program.__dict__ for program in retrieved_user["teams"]["programs"]]

    def dictionarify_nested(prop):
        print(f'{type(prop)}, checking prop general')

        if issubclass(type(prop), list):
            print(f'{prop}, checking prop in list')

            return [dictionarify_nested(item) for item in prop]

        # if dict, assign 
        elif type(prop) is dict:
            print(f'{prop}, checking prop in is dict and not sa')

            for key in prop.keys():
                print(f'{key}, checking key in dict')

                if key is not "_sa_instance_state":
                    prop[key] = dictionarify_nested(prop[key])
            return prop

        # # if its a string, return the string
        # elif type(prop) is str:
        #     print(type(prop))
        #     return prop

        # #if integer, return the integer
        # elif type(prop) is int:
        #     print(type(prop))
        #     return prop

        # #if bool, return the bool
        # elif type(prop) is bool:
        #     print(type(prop))
        #     return prop

        # elif prop is None:
        #     print(type(prop))
        #     return prop    

        # elif type(prop) is datetime.datetime:
        #     print(type(prop))
        #     return prop   

        # elif type(prop) is UUID:
        #     print(type(prop))
        #     return prop       

        # at end have else (assuming its an object that needs to be dicted- return object.dicted)
        else:
            print(f'{type(prop).__bases__}, checking prop bases in else')

            try:
                return dictionarify_nested(prop.__dict__)
            except:
                return prop

    full_dictionary = dictionarify_nested(retrieved_user)

    session.close()

            # print(f'{prop}, checking prop in else')

    return full_dictionary



        # for key in dict.keys():
        #     if type(dict[key]) is list:
        #         [item.__dict__ for item in dict[key]]
        # return list

    

    # retrieved_user["teams"]["programs"]
        # result = map(lambda item: list.item, list)


@query.field("dataset")
@convert_kwargs_to_snake_case
def resolve_dataset(obj, info, id):
    '''GraphQL query to find a dataset based on dataset ID.
        :param id: Id for the dataset to be fetched
        :returns: Dataset dictionary with eager-loaded associated Tags and Records
    '''
    session = SessionLocal()

    retrieved_dataset = session.query(Dataset).filter(Dataset.id == id).options(joinedload("tags"), joinedload("records")).first().__dict__
    retrieved_dataset["records"] = [record.__dict__ for record in retrieved_dataset['records']]
    retrieved_dataset["tags"] = [tag.__dict__ for tag in retrieved_dataset['tags']]

    session.close()

    return retrieved_dataset