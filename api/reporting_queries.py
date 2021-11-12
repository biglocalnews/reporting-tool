from operator import and_
from typing import Any
from ariadne import convert_kwargs_to_snake_case, ObjectType
from ariadne.types import GraphQLResolveInfo
from sqlalchemy.orm.util import outerjoin
from sqlalchemy.sql.functions import func
from database import CategoryValue, Entry, Record, Category, Dataset, Tag, Team, Target

query = ObjectType("Query")
category_overview = ObjectType("CategoryOverview")
reporting_overview = ObjectType("ReportingOverview")

reporting_queries = [query, category_overview, reporting_overview]


@query.field("reportingOverview")
@reporting_overview.field("categoriesOverview")
@convert_kwargs_to_snake_case
def resolve_reporting_overview(obj: Any, info: GraphQLResolveInfo, **kwargs):
    '''GraphQL query to fetch fields for reporting overview.
    :returns: reporting overview object fields
    '''
    categories_overview = resolve_categories_overview(obj, info, **kwargs)
    return categories_overview

@reporting_overview.field("countData")
def resolve_count_data(obj: Any, info: GraphQLResolveInfo, **kwargs):
    '''GraphQL query to fetch counts for teams, datasets, and tags
    :returns: dict of counts for teams, datasets, and tags
    '''
    session = info.context['dbsession']

    teams_count = Team.get_unfiltered_count(session)
    datasets_count = Dataset.get_unfiltered_count(session)
    tags_count = Tag.get_unfiltered_count(session)

    return {'teams_count': teams_count, 'datasets_count': datasets_count, 'tags_count': tags_count}


@query.field("categoryOverview")
@convert_kwargs_to_snake_case
def resolve_category_overview(obj: Any, info: GraphQLResolveInfo, id, **kwargs):
    '''GraphQL query to fetch category by ID for overview.
    :param id: ID of category to retrieve
    :param kwargs: Optional parameters passed to resolver
    :returns: category object
    '''
    session = info.context['dbsession']
    return session.query().with_entities(Category.id, Category.name, Category.description).\
        filter(Category.id == id, Category.deleted == None).first()


@category_overview.field("sumCategoryValues")
@convert_kwargs_to_snake_case
def resolve_sum_category_values(category: Any, info: GraphQLResolveInfo):
    '''GraphQL query to sum the counts by category value
        :param category: Category object to filter counts for
        :returns: Dictionary
    '''
    session = info.context['dbsession']

    # only sum counts for entries that have not been removed
    filters = [Entry.deleted == None, CategoryValue.deleted == None]

    # optional start and end date params passed to resolver
    if 'dateRange' in info.variable_values:
        start = info.variable_values['dateRange']['startDate']
        end = info.variable_values['dateRange']['endDate']
        # conditionally apply filters if date range exists for the query
        filters.append(Record.publication_date >= start)
        filters.append(Record.publication_date <= end)

    sub_stmt = session.query(
            CategoryValue.category_id.label('category_id'),
            CategoryValue.name.label('category_value_name'),
            CategoryValue.id.label('category_value_id'),
            func.sum(Entry.count).label('sum_of_counts')).\
                join(CategoryValue.entries).\
                join(Entry.record).\
                    group_by(CategoryValue.id).\
                    filter(*filters).\
                        subquery()
    
    stmt = session.query(Target.target.label('target'), sub_stmt).\
        outerjoin(sub_stmt, Target.category_value_id == sub_stmt.c.category_value_id).\
            filter(sub_stmt.c.category_id == category.id, Target.deleted == None)
        
    # sum across all category attribute counts
    total_sum_of_category_values = sum(row.sum_of_counts for row in stmt)
                                
    return [
        {'category_value_id': row.category_value_id,
         'category_value': row.category_value_name,
         'category_value_target': row.target,
         'sum': row.sum_of_counts,
         'percentage_of_total_sum': row.sum_of_counts / total_sum_of_category_values}
        for row in stmt]


@query.field("categoriesOverview")
@convert_kwargs_to_snake_case
def resolve_categories_overview(obj: Any, info: GraphQLResolveInfo, **kwargs):
    '''GraphQL query to fetch overview for all categories
    :returns: category object
    '''
    session = info.context['dbsession']
    return session.query().with_entities(Category.id, Category.name, Category.description).\
        filter(Category.deleted == None).all()
