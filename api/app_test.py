import unittest
from unittest.mock import Mock

from ariadne import graphql_sync
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import schema
from database import create_tables, create_dummy_data
from datetime import datetime


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

    def test_query_dataset(self):
        success, result = self.run_graphql_query({
            "operationName": "QueryDataset",
            "query": """
                query QueryDataset($id: ID!) {
                   dataset(id: $id) {
                        id
                        name
                        description
                   }
                }
            """,
            "variables": {
                "id": "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89",
            },
        })

        self.assertTrue(success)
        self.assertEqual(result, {
            "data": {
                "dataset": {
                    "id" : "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89",
                    "name": "Breakfast Hour",
                    "description": "breakfast hour programming",
                },
            },
        })
    def test_create_dataset(self):
        success, result = self.run_graphql_query({
            "operationName": "CreateDataset",
            "query": """
                mutation CreateDataset($input: CreateDatasetInput) {
                   createDataset(input: $input) {
                        name
                        description
                        program {
                            name
                        }
                        tags {
                            name
                        }
                   }
                }
            """,
            "variables": {
                "input": {
                    "name": "Happy Hour",
                    "description": "A very happy time",
                    "programId": "1e73e788-0808-4ee8-9b25-682b6fa3868b",
                    "inputterId": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                    "tags": [{"name": "Europe", "description": "i am europe", "tagType": "location"}]
                } 
            },
        })

        self.assertTrue(success)
        self.assertEqual(result, {
            "data": {
                "createDataset": {
                    "name": "Happy Hour",
                    "description": "A very happy time",
                    "program": {"name": "BBC News"},
                    "tags": [{"name": "Europe"}]
                },
            },
        })    
    def test_update_dataset(self):
        success, result = self.run_graphql_query({
            "operationName": "UpdateDataset",
            "query": """
                mutation UpdateDataset($input: UpdateDatasetInput) {
                   updateDataset(input: $input) {
                        name
                        description
                        program {
                            name
                        }
                        tags {
                            name
                        }
                   }
                }
            """,
            "variables": {
                "input": {
                    "id": "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89",
                    "name": "Tea Time",
                    "description": "Tea time programming",
                    "tags": [{"name": "Asia", "description": "i am asia", "tagType": "location"}]
                } 
            },
        })

        self.assertTrue(success)
        self.assertEqual(result, {
            "data": {
                "updateDataset": {
                    "name": "Tea Time",
                    "description": "Tea time programming",
                    "program": {"name": "BBC News"},
                    "tags": [{"name": "News"}, {"name": "Asia"}]
                },
            },
        })    

    def test_delete_dataset(self):
        success, result = self.run_graphql_query({
            "operationName": "DeleteDataset",
            "query": """
                mutation DeleteDataset($id: ID!) {
                   deleteDataset(id: $id)
                }
            """,
            "variables": {
                "id": "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89"
            },
        })

        self.assertTrue(success)
        self.assertEqual(result, {
            "data": {
                "deleteDataset": "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89"
            },
        })         
    def test_query_record(self):
        success, result = self.run_graphql_query({
            "operationName": "QueryRecord",
            "query": """
                query QueryRecord($id: ID!) {
                   record(id: $id) {
                        id
                        publicationDate
                        dataset {
                            id
                        }
                   }
                }
            """,
            "variables": {
                "id": "742b5971-eeb6-4f7a-8275-6111f2342bb4",
            },
        })

        self.assertTrue(success)
        self.assertEqual(result, {
            "data": {
                "record": {
                    "id" : "742b5971-eeb6-4f7a-8275-6111f2342bb4",
                    "publicationDate": "2020-12-21 00:00:00",
                    "dataset": {"id": "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89"}
                },
            },
        })
    def test_create_record(self):
        success, result = self.run_graphql_query({
            "operationName": "CreateRecord",
            "query": """
                mutation CreateRecord($input: CreateRecordInput!) {
                   createRecord(input: $input) {
                        publicationDate
                        dataset {
                            id
                            name
                        }
                        entries {
                            categoryValue
                            count
                        }
                   }
                }
            """,
            "variables": {
                "input": {
                    "datasetId": "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89",
                    # datetime.strptime converts a string to a datetime object bc of SQLite DateTime limitation-
                    "publicationDate": datetime.strptime('2020-12-22 00:00:00', '%Y-%m-%d %H:%M:%S'),
                    "entries":[{"category": "gender", "categoryValue": "transgender", "count": 4}, {"category": "gender", "categoryValue": "female", "count": 4}]
                }
            },
        })

        self.assertTrue(success)
        self.assertEqual(result, {
            "data": {
                "createRecord": {
                    "publicationDate": "2020-12-22 00:00:00",
                    "dataset": {"id": "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89", "name": "Breakfast Hour"},
                    "entries": [{"categoryValue": "transgender", "count": 4}, {"categoryValue": "female", "count": 4}]
                },
            },
        })

    def test_update_record(self):
        success, result = self.run_graphql_query({
            "operationName": "UpdateRecord",
            "query": """
                mutation UpdateRecord($input: UpdateRecordInput!) {
                    updateRecord(input: $input) {
                        publicationDate
                        dataset {
                            id
                            name
                        }
                        entries {
                            categoryValue
                            count
                        }
                   }
                }
            """,
            "variables": {
                "input": {
                    "id": "742b5971-eeb6-4f7a-8275-6111f2342bb4",
                    # datetime.strptime converts a string to a datetime object bc of SQLite DateTime limitation-
                    "publicationDate": datetime.strptime('2020-12-25 00:00:00', '%Y-%m-%d %H:%M:%S'),
                    "datasetId": "96336531-9245-405f-bd28-5b4b12ea3798",
                    "entries": [{"id": "64677dc1-a1cd-4cd3-965d-6565832d307a", "category": "gender", "categoryValue": "trans", "count": 10}, ]
                } 
            },
        })

        self.assertTrue(success)
        self.assertEqual(result, {
            "data": {
                "updateRecord": {
                    "publicationDate": "2020-12-25 00:00:00",
                    "dataset": {"id": "96336531-9245-405f-bd28-5b4b12ea3798", "name": "12PM - 4PM"},
                    "entries": [{"categoryValue": "trans", "count": 10}]
                },
            },
        })   

    def test_delete_record(self):
        success, result = self.run_graphql_query({
            "operationName": "DeleteRecord",
            "query": """
                mutation DeleteRecord($id: ID!) {
                   deleteRecord(id: $id)
                }
            """,
            "variables": {
                "id": "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89"
            },
        })

        self.assertTrue(success)
        self.assertEqual(result, {
            "data": {
                "deleteRecord": "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89"
            },
        })  

if __name__ == '__main__':
    unittest.main()
