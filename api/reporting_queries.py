from typing import Any
from ariadne import convert_kwargs_to_snake_case, ObjectType
from ariadne.types import GraphQLResolveInfo
from sqlalchemy.sql.functions import func
from database import (CategoryValue, Entry, Record)
from queries import resolve_category, resolve_categories

query = ObjectType("Query")
category_overview = ObjectType("CategoryOverview")

reporting_queries = [query, category_overview]

@query.field("categoryOverview")
@convert_kwargs_to_snake_case
def resolve_category_overview(obj: Any, info: GraphQLResolveInfo, id, **kwargs):
    '''GraphQL query to fetch category by ID for overview.
    :param id: ID of category to retrieve
    :param kwargs: Optional parameters passed to resolver
    :returns: category object
    '''

    print("obj", obj)
    return resolve_category(obj, info, id)


@category_overview.field("sumCategoryValues")
@convert_kwargs_to_snake_case
def resolve_sum_category_values(category: Any, info: GraphQLResolveInfo):
    '''GraphQL query to sum the counts by category value
        :param category: Category object to filter counts for
        :returns: Dictionary
    '''
    session = info.context['dbsession']

    stmt = session.query(
            CategoryValue.name.label('category_value_name'),
            CategoryValue.id.label('category_value_id'),
            func.sum(Entry.count).label('sum_of_counts')).\
                join(CategoryValue.entries).\
                join(Entry.record).\
                    group_by(CategoryValue.id).\
                    filter(CategoryValue.category_id == category.id, Entry.deleted == None, CategoryValue.deleted == None)

    # optional start and end date params passed to categoryOverview
    if 'dateRange' in info.variable_values:
        start = info.variable_values['dateRange']['start_date']
        end = info.variable_values['dateRange']['end_date']
        # filter results by date range if provided in thr query
        stmt = stmt.filter(Record.publication_date >= start, Record.publication_date <= end)
                                
    return [
        {'category_value_id': row.category_value_id,
         'category_value': row.category_value_name,
         'sum': row.sum_of_counts}
        for row in stmt]


@query.field("categoriesOverview")
@convert_kwargs_to_snake_case
def resolve_categories_overview(obj: Any, info: GraphQLResolveInfo, **kwargs):
    '''GraphQL query to fetch overview for all categories
    :returns: category object
    '''
    return resolve_categories(obj, info)
