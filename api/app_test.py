import unittest
from unittest.mock import Mock

from ariadne import graphql_sync
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import schema
from database import create_tables, create_dummy_data, Record, Entry, Dataset, Category
from uuid import UUID


class TestGraphQL(unittest.TestCase):

    def setUp(self):
        # Create in-memory sqlite database
        self.engine = create_engine('sqlite://')
        # Turn on foreign keys to emulate Postgres better (without this things
        # like cascading deletes won't work)
        self.engine.execute('PRAGMA foreign_keys = ON')
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

    def is_valid_uuid(self, uuid_to_test, version=4):
        """
        Check if uuid_to_test is a valid UUID.
        
        Parameters
        ----------
        uuid_to_test : str
        version : {1, 2, 3, 4}
        
        Returns
        -------
        `True` if uuid_to_test is a valid UUID, otherwise `False`.
        
        Examples
        --------
        >>> is_valid_uuid('c9bf9e57-1685-4c89-bafb-ff5af830be8a')
        True
        >>> is_valid_uuid('c9bf9e58')
        False
        """
        
        try:
            uuid_obj = UUID(uuid_to_test, version=version)
        except ValueError:
            return False
        return str(uuid_obj) == uuid_to_test

    def test_query_user(self):
        success, result = self.run_graphql_query({
            "operationName": "QueryUser",
            "query": """
                query QueryUser($id: ID!) {
                   user(id: $id) {
                      id
                      firstName
                      lastName
                      teams {
                        name
                        programs {
                          name
                          datasets {
                            name
                            records {
                                id
                                publicationDate
                            }
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
        self.assertTrue(self.is_valid_uuid(result["data"]["user"]["id"]), "Invalid UUID")
        self.assertEqual(result, {
            "data": {
                "user": {
                    "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                    "firstName": "Cat",
                    "lastName": "Berry",
                    "teams": [{
                        "name": "News Team",
                        "programs": [{
                            "name": "BBC News",
                            "datasets": [{
                                "name": "Breakfast Hour",
                                "records": [{
                                    "id": "742b5971-eeb6-4f7a-8275-6111f2342bb4",
                                    "publicationDate": "2020-12-21T00:00:00"
                                }]
                            }, {
                                "name": "12PM - 4PM",
                                "records": []
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
                        program {
                            id
                            name
                            tags {
                                name
                            }
                        }
                        records {
                            id
                            publicationDate
                            entries {
                                category {
                                    id
                                    categoryValue
                                }
                            } 
                        }       
                        inputter {
                            id
                            firstName
                        }
                        tags {
                            id
                            name
                        }
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
                    "id": "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89",
                    "name": "Breakfast Hour",
                    "description": "breakfast hour programming",
                    "program": {
                        "id": "1e73e788-0808-4ee8-9b25-682b6fa3868b",
                        "name": "BBC News",
                        "tags": [{
                            "name": "News"
                        }]
                    },
                    "records": [{
                        "id": "742b5971-eeb6-4f7a-8275-6111f2342bb4", 
                        "publicationDate": "2020-12-21T00:00:00",
                        "entries": [
                            {"category": {
                            "id": "51349e29-290e-4398-a401-5bf7d04af75e",
                            "categoryValue": "non-binary"
                            }}, 
                            {"category": {
                                "id": "0034d015-0652-497d-ab4a-d42b0bdf08cb",
                                "categoryValue": "cisgender women"
                            }},
                            {"category": {
                                "id": "d237a422-5858-459c-bd01-a0abdc077e5b",
                                "categoryValue": "cisgender men"
                            }},
                            {'category': {
                                "id": "662557e5-aca8-4cec-ad72-119ad9cda81b", 
                                "categoryValue": "trans women"
                            }},
                            {'category': {
                                "id": "1525cce8-7db3-4e73-b5b0-d2bd14777534", 
                                "categoryValue": "trans men"
                            }},
                            {'category': {
                                "id": "a72ced2b-b1a6-4d3d-b003-e35e980960df", 
                                "categoryValue": "gender non-conforming"
                            }}
                        ]
                    }],
                    "inputter": {
                        "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77", 
                        "firstName": "Cat"
                    },
                    "tags": [{
                        "id": "4a2142c0-5416-431d-b62f-0dbfe7574688",
                        "name": "News"
                    }]
                },
            },
        })       
    def test_create_dataset(self):
        success, result = self.run_graphql_query({
            "operationName": "CreateDataset",
            "query": """
                mutation CreateDataset($input: CreateDatasetInput) {
                   createDataset(input: $input) {
                        id
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
        self.assertTrue(self.is_valid_uuid(result["data"]["createDataset"]["id"]), "Invalid UUID")
        self.assertEqual(result, {
            "data": {
                "createDataset": {
                    "id": result["data"]["createDataset"]["id"],
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
                        id
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
        self.assertTrue(self.is_valid_uuid(result["data"]["updateDataset"]["id"]), "Invalid UUID")
        self.assertEqual(result, {
            "data": {
                "updateDataset": {
                    "id": "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89",
                    "name": "Tea Time",
                    "description": "Tea time programming",
                    "program": {"name": "BBC News"},
                    "tags": [{"name": "News"}, {"name": "Asia"}]
                },
            },
        })    

    def test_delete_dataset(self):
        # Confirm Dataset exists, then that it does not.
        dataset_id = "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89"
        existing_dataset= self.session.query(Dataset).filter(Dataset.id == dataset_id)
        self.assertEqual(existing_dataset.count(), 1)
        success, result = self.run_graphql_query({
            "operationName": "DeleteDataset",
            "query": """
                mutation DeleteDataset($id: ID!) {
                   deleteDataset(id: $id)
                }
            """,
            "variables": {
                "id": dataset_id
            },
        })

        self.assertTrue(success)
        # Query for all associated Records
        associated_records = self.session.query(Record).filter(Record.dataset_id == dataset_id)
        # Compile list of associated Record IDs
        associated_record_ids = [record.id for record in associated_records]
        # Query for non-deleted Entries associated with each Record id
        existing_entries = self.session.query(Entry).filter(Entry.record_id.contains(associated_record_ids), Entry.deleted is None)
        # Querying for non-deleted associated Records
        existing_records = associated_records.filter(Record.deleted is None)
        # Count of non-deleted records, and entries should be zero
        self.assertEqual(existing_entries.count(), 0)
        self.assertEqual(existing_records.count(), 0)
        self.assertTrue(self.is_valid_uuid(dataset_id), "Invalid UUID")

        self.assertEqual(result, {
            "data": {
                "deleteDataset": dataset_id
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
                        entries {
                            category {
                                id
                                categoryValue
                            }
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
                    "publicationDate": "2020-12-21T00:00:00",
                    "dataset": {"id": "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89"},
                    "entries": [
                        {"category": {
                        "id": "51349e29-290e-4398-a401-5bf7d04af75e",
                        "categoryValue": "non-binary"
                        }}, 
                        {"category": {
                            "id": "0034d015-0652-497d-ab4a-d42b0bdf08cb",
                            "categoryValue": "cisgender women"
                        }},
                        {"category": {
                            "id": "d237a422-5858-459c-bd01-a0abdc077e5b",
                            "categoryValue": "cisgender men"
                        }},
                        {'category': {
                            "id": "662557e5-aca8-4cec-ad72-119ad9cda81b", 
                            "categoryValue": "trans women"
                        }},
                        {'category': {
                            "id": "1525cce8-7db3-4e73-b5b0-d2bd14777534", 
                            "categoryValue": "trans men"
                        }},
                        {'category': {
                            "id": "a72ced2b-b1a6-4d3d-b003-e35e980960df", 
                            "categoryValue": "gender non-conforming"
                        }}
                    ]
                },
            },
        })
    def test_create_record(self):
        success, result = self.run_graphql_query({
            "operationName": "CreateRecord",
            "query": """
                mutation CreateRecord($input: CreateRecordInput!) {
                   createRecord(input: $input) {
                        id
                        publicationDate
                        dataset {
                            id
                            name
                        }
                        entries {
                            category {
                                categoryValue
                            }       
                        }
                   }
                }
            """,
            "variables": {
                "input": {
                    "datasetId": "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89",
                    "publicationDate": '2020-12-22T00:00:00.000Z',
                    "entries": [{
                        "category": 
                            {
                            "category": "race",
                            "categoryValue": "asian",
                            "description": "i am a description"
                            },   
                            "count":  7  
                    }],
                }
            },
        })
        self.assertTrue(success)
        self.assertTrue(self.is_valid_uuid(result["data"]["createRecord"]["id"]), "Invalid UUID")
        self.assertEqual(result, {
            "data": {
                "createRecord": {
                    "id": result["data"]["createRecord"]["id"],
                    "publicationDate": "2020-12-22T00:00:00",
                    "dataset": {"id": "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89", "name": "Breakfast Hour"},
                    "entries": [{"category": {"categoryValue": "asian"}}]
                },
            },
        })

    def test_update_record(self):
        success, result = self.run_graphql_query({
            "operationName": "UpdateRecord",
            "query": """
                mutation UpdateRecord($input: UpdateRecordInput!) {
                    updateRecord(input: $input) {
                        id
                        publicationDate
                        dataset {
                            id
                            name
                        }
                        entries {
                            count
                            category {
                                id
                                categoryValue
                            }
                        }
                   }
                }
            """,
            "variables": {
                "input": {
                    "id": "742b5971-eeb6-4f7a-8275-6111f2342bb4",
                    "publicationDate": '2020-12-25T00:00:00.000Z',
                    "datasetId": "96336531-9245-405f-bd28-5b4b12ea3798",
                    "entries": [{
                        "id": "64677dc1-a1cd-4cd3-965d-6565832d307a",
                        "category": 
                            {"id": "51349e29-290e-4398-a401-5bf7d04af75e", 
                             "category": "race", 
                             "categoryValue": "asien",
                             "description": "i am a new description"
                            },
                        "count": 19
                        },
                        {
                        "category": {
                            "category": "taste", 
                            "categoryValue": "sour",
                            "description": "i am a new description"
                        },
                        "count": 22
                        }
                    ]  
                } 
            },
        })
        
        self.assertTrue(success)
        self.assertTrue(self.is_valid_uuid(result["data"]["updateRecord"]["id"]), "Invalid UUID")

        new_category = self.session.query(Category).filter(Category.category_value == "sour").first()

        self.assertEqual(result, {
            "data": {
                "updateRecord": {
                    "id": "742b5971-eeb6-4f7a-8275-6111f2342bb4",
                    "publicationDate": "2020-12-25T00:00:00",
                    "dataset": {"id": "96336531-9245-405f-bd28-5b4b12ea3798", "name": "12PM - 4PM"},
                    "entries": [
                        {"count":19, "category": {"id": "51349e29-290e-4398-a401-5bf7d04af75e", "categoryValue": "asien"}}, 
                        {"count": 1, "category": {'id': "0034d015-0652-497d-ab4a-d42b0bdf08cb", "categoryValue": 'cisgender women'}},
                        {"count": 1, "category": {'id': "d237a422-5858-459c-bd01-a0abdc077e5b", "categoryValue": 'cisgender men'}},
                        {"count": 1, "category": {'id': "662557e5-aca8-4cec-ad72-119ad9cda81b", "categoryValue": 'trans women'}},
                        {"count": 1, "category": {'id': "1525cce8-7db3-4e73-b5b0-d2bd14777534", "categoryValue": 'trans men'}},
                        {"count": 1, "category": {'id': "a72ced2b-b1a6-4d3d-b003-e35e980960df", "categoryValue": 'gender non-conforming'}},
                        {"count": 22, "category": {"id": f'{new_category.id}', "categoryValue": "sour"}}
                    ]
                },
            },
        })   

    def test_delete_record(self):
        # Confirm Record exists, then that it does not.
        record_id = "742b5971-eeb6-4f7a-8275-6111f2342bb4"
        existing_record = self.session.query(Record).filter(Record.id == record_id)
        # Count of non-deleted entries should be zero
        self.assertEqual(existing_record.count(), 1)
        success, result = self.run_graphql_query({
            "operationName": "DeleteRecord",
            "query": """
                mutation DeleteRecord($id: ID!) {
                   deleteRecord(id: $id)
                }
            """,
            "variables": {
                "id": record_id
            },
        })

        self.assertTrue(success)
        # Query for Record 
        record = self.session.query(Record).filter(Record.id == record_id)
        # Record count should be zero
        self.assertEqual(record.count(), 0)
        # Query for all associated Entries
        associated_entries = self.session.query(Entry).filter(Entry.record_id == record_id)
        # Entries count should be zero
        self.assertEqual(associated_entries.count(), 0)
        self.assertTrue(self.is_valid_uuid(record_id), "Invalid UUID")
        self.assertEqual(result, {
            "data": {
                "deleteRecord": record_id
            },
        })  
if __name__ == '__main__':
    unittest.main()
