import unittest
from unittest.mock import Mock

from ariadne import graphql_sync
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import schema
from database import create_tables, create_dummy_data


class TestGraphQL(unittest.TestCase):

    def setUp(self):
        # Create in-memory sqlite database
        self.engine = create_engine('sqlite://')
        Session = sessionmaker(bind=self.engine)
        session = Session()

        create_tables(self.engine, session)
        create_dummy_data(session)
        session.close()

        # Create new, fresh session for test case to use
        self.session = Session()

    def tearDown(self):
        self.session.close()
        self.engine.dispose()

    def run_graphql_query(self, data):
        # Run the GraphQL query
        return graphql_sync(
                schema,
                data,
                context_value={
                    'dbsession': self.session,
                    'request': Mock(),
                    },
                debug=True)

    def test_query_user(self):
        success, result = self.run_graphql_query({
            "operationName": "QueryUser",
            "query": """
                query QueryUser($id: ID!) {
                   user(id: $id) {
                      firstName
                      lastName
                      teams {
                        name
                        programs {
                          name
                          datasets {
                            name
                          }
                        }
                      }
                   }
                }
            """,
            "variables": {
                "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
            },
        })

        # Make sure result is what we expected
        self.assertTrue(success)
        self.assertEqual(result, {
            "data": {
                "user": {
                    "firstName": "Cat",
                    "lastName": "Berry",
                    "teams": [{
                        "name": "News Team",
                        "programs": [{
                            "name": "BBC News",
                            "datasets": [{
                                "name": "Breakfast Hour",
                            }, {
                                "name": "12PM - 4PM",
                            }],
                        }],
                    }],
                },
            },
        })


if __name__ == '__main__':
    unittest.main()
