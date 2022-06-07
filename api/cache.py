from database import Cache
import logging


def get_or_create_cached_object(session, key, new_func):

    cached_object = {}

    try:
        db_cached_object = session.get(Cache, key)
        if not db_cached_object:
            cached_object = new_func(session)
            session.add(Cache(id=key, document=cached_object))
            session.commit()
        else:
            cached_object = db_cached_object.document
    except Exception as ex:
        logging.error(ex)

    return cached_object
