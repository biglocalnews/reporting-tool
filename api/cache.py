from database import Cache


def get_or_create_cached_object(session, key, new_func):
    cached_object = {}

    try:
        db_cached_object = session.query(Cache).get(key)
        if db_cached_object:
            cached_object = db_cached_object.document
    except Exception as ex:
        print(ex)

    if not cached_object:
        cached_object = new_func(session)
        session.add(Cache(id=key, document=cached_object))
        session.commit()

    return cached_object
