from ariadne import convert_kwargs_to_snake_case, ObjectType
from sqlalchemy.sql.functions import func
from database import (CategoryValue, Entry)
from queries import resolve_category, resolve_categories

query = ObjectType("Query")
category_overview = ObjectType("CategoryOverview")

reporting_queries = [query, category_overview]

@query.field("categoryOverview")
@convert_kwargs_to_snake_case
def resolve_category_overview(obj, info, id):
    '''GraphQL query to fetch category by ID for overview.
    :returns: category object
    '''
    return resolve_category(obj, info, id)


@category_overview.field("sumCategoryValues")
def resolve_sum_category_values(category, info):
    '''GraphQL query to sum the counts by category value
        :param category: Category object to filter counts for
        :returns: Dictionary
    '''
    session = info.context['dbsession']
    stmt = session.query(
            CategoryValue.name.label('category_value_name'),
            CategoryValue.id.label('category_value_id'),
            func.sum(Entry.count).label('sum_of_counts')).\
            join(Entry).\
                group_by(CategoryValue.id).\
                    filter(CategoryValue.category_id == category.id, Entry.deleted == None, CategoryValue.deleted == None)

    return [
        {'category_value_id': row.category_value_id,
         'category_value': row.category_value_name,
         'sum': row.sum_of_counts}
        for row in stmt]


@query.field("categoriesOverview")
@convert_kwargs_to_snake_case
def resolve_categories_overview(obj, info):
    '''GraphQL query to fetch overview for all categories.
    :returns: category object
    '''
    return resolve_categories(obj, info)
