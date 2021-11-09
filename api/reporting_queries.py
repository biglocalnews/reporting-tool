from ariadne import convert_kwargs_to_snake_case, ObjectType
from sqlalchemy.sql.expression import func
from database import (
        Category,
        CategoryValue,
        Entry,
        )

query = ObjectType("Query")
category_overview = ObjectType("CategoryOverview")
sum_category_values = ObjectType("SumCategoryValues")

reporting_queries = [query, category_overview, sum_category_values]

@query.field("categoryOverview")
@convert_kwargs_to_snake_case
def resolve_category_overview(obj, info, id):
    '''GraphQL query to fetch category by ID for overview.
    :returns: category object
    '''
    session = info.context['dbsession']
    category = Category.get_not_deleted(session, id)
    return category


@category_overview.field("sumCategoryValues")
def resolve_sum_category_values(category, info):
    '''GraphQL query to sum the counts by category value
        :param category: Category object to filter counts for
        :returns: Dictionary
    '''
    session = info.context['dbsession']

    stmt = session.query(Entry.category_value_id, func.sum(Entry.count).label('sum_of_counts')).\
        join(Entry.category_value).filter(CategoryValue.category_id == category.id, 
        Entry.deleted == None).group_by(Entry.category_value_id).all()

    rel = [{'category_value_id': row[0], 'category_value': CategoryValue.get_not_deleted(session, row[0]).name,'sum': row[1]} for row in stmt]

    return rel