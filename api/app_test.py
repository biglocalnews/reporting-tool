import unittest
import sqlalchemy
from unittest.mock import Mock, patch

from fastapi_users.utils import generate_jwt, JWT_ALGORITHM
from fastapi_users.password import verify_and_update_password
from fastapi.testclient import TestClient
from ariadne import graphql_sync
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import schema, app, cookie_authentication
from user import user_db
from database import (
        Base,
        create_tables,
        create_dummy_data,
        Record,
        Entry,
        Dataset,
        Category,
        CategoryValue,
        User,
        Team,
        Program
        )
from uuid import UUID


def get_valid_token(aud, **kwargs):
    data = {"aud": aud}
    data.update(kwargs)
    return generate_jwt(data,
            cookie_authentication.lifetime_seconds,
            cookie_authentication.secret,
            JWT_ALGORITHM)


class BaseAppTest(unittest.TestCase):
    """Base test runner that sets up an in-memory database that test cases can
    make assertions against.
    """
    # Get full diff outuput
    maxDiff = None

    def setUp(self):
        # Create in-memory sqlite database. This is configured to work with
        # multithreaded environments, so it can be used safely with the real
        # FastAPI app instance.
        self.engine = create_engine('sqlite:///:memory:',
                connect_args={'check_same_thread': False},
                poolclass=StaticPool)

        # Turn on foreign keys to emulate Postgres better (without this things
        # like cascading deletes won't work)
        self.engine.execute('PRAGMA foreign_keys = ON')
        Session = sessionmaker(bind=self.engine)
        session = Session()

        create_tables(self.engine, session)
        create_dummy_data(session)

        session.close()

        # Expose the session maker so a test can make one
        self.Session = Session

    def tearDown(self):
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()


class TestAppUsers(BaseAppTest):
    """Test /users/ API routes."""

    def setUp(self):
        super().setUp()

        # Mock out database objects to use in-memory DB.
        app.extra['database'] = Mock()
        app.extra['get_db_session'] = self.Session
        user_db.session_factory = self.Session

        # Mock the email sender
        self.send_email_patch = patch('mailer.send_email')
        self.mock_send_email = self.send_email_patch.start()

        # Set up Starlette test client
        self.client = TestClient(app)

        # A few user fixtures to use for testing different scenarios
        self.user_ids = {
                'normal': 'cd7e6d44-4b4d-4d7a-8a67-31efffe53e77',
                'admin': 'df6413b4-b910-4f6e-8f3c-8201c9e65af3',
                'other': 'a47085ba-3d01-46a4-963b-9ffaeda18113',
                }

    def tearDown(self):
        super().tearDown()
        self.send_email_patch.stop()

    def test_users_me_not_authed(self):
        """Checks that route returns error when user is not authed."""
        response = self.client.get('/users/me')
        assert response.status_code == 401
        assert response.json() == {'detail': 'Unauthorized'}

    def test_users_me_normal(self):
        """Checks that a user can get info about themselves."""
        response = self.client.get('/users/me',
                cookies={'rtauth': get_valid_token("fastapi-users:auth", user_id=self.user_ids['normal'])})
        assert response.status_code == 200
        assert response.json() == {
                'id': 'cd7e6d44-4b4d-4d7a-8a67-31efffe53e77',
                'email': 'tester@notrealemail.info',
                'first_name': 'Cat',
                'last_name': 'Berry',
                'is_active': True,
                'is_verified': False,
                'is_superuser': False,
                'roles': [],
                'teams': [{'id': '472d17da-ff8b-4743-823f-3f01ea21a349', 'name': 'News Team'}],
                }

    def test_users_me_admin(self):
        """Checks that an admin user can get info about themselves."""
        response = self.client.get('/users/me',
                cookies={'rtauth': get_valid_token("fastapi-users:auth", user_id=self.user_ids['admin'])})
        assert response.status_code == 200
        assert response.json() == {
                'id': 'df6413b4-b910-4f6e-8f3c-8201c9e65af3',
                'email': 'admin@notrealemail.info',
                'first_name': 'Daisy',
                'last_name': 'Carrot',
                'is_active': True,
                'is_verified': False,
                'is_superuser': True,
                'roles': [{
                    "id": "be5f8cac-ac65-4f75-8052-8d1b5d40dffe",
                    'description': 'User is an admin and has administrative privileges',
                    'name': 'admin',
                    }],
                'teams': [],
                }

    def test_users_register_admin(self):
        """Checks that an admin can create a new user."""
        response = self.client.post(
                "/auth/register",
                cookies={'rtauth': get_valid_token("fastapi-users:auth", user_id=self.user_ids['admin'])},
                json={
                    "email": "new@user.org",
                    "first_name": "new",
                    "last_name": "user",
                    "password": "password123",
                    "roles": [],
                    "teams": [],
                    })
        assert response.status_code == 201
        rsp_json = response.json()
        assert rsp_json == {
                'id': rsp_json.get('id'),
                'email': 'new@user.org',
                'is_active': True,
                'is_verified': False,
                'is_superuser': False,
                'first_name': 'new',
                'last_name': 'user',
                'roles': [],
                'teams': [],
                }
        self.mock_send_email.assert_called_once()
        assert self.mock_send_email.call_args[0][0]["Subject"] == "Your new reporting tool account"

    def test_users_register_normal(self):
        """Checks that a normal user cannot create a new user."""
        response = self.client.post(
                "/auth/register",
                cookies={'rtauth': get_valid_token("fastapi-users:auth", user_id=self.user_ids['normal'])},
                json={
                    "email": "new@user.org",
                    "first_name": "new",
                    "last_name": "user",
                    "password": "password123",
                    "roles": [],
                    "teams": [],
                    })
        assert response.status_code == 403
        rsp_json = response.json()
        assert rsp_json == {'detail': 'You do not have permission for this action'}

    def test_users_register_not_logged_in(self):
        """Checks that an anonymous user cannot create a new user."""
        response = self.client.post(
                "/auth/register",
                json={
                    "email": "new@user.org",
                    "first_name": "new",
                    "last_name": "user",
                    "password": "password123",
                    "roles": [],
                    "teams": [],
                    })
        assert response.status_code == 401
        rsp_json = response.json()
        assert rsp_json == {'detail': 'You are not authenticated'}

    def test_user_register_teams_and_roles(self):
        """Test that user cannot be added to team / roles on creation."""
        response = self.client.post(
                "/auth/register",
                cookies={'rtauth': get_valid_token("fastapi-users:auth", user_id=self.user_ids['admin'])},
                json={
                    "email": "new@user.org",
                    "first_name": "new",
                    "last_name": "user",
                    "password": "password123",
                    "roles": [{
                        "id": "be5f8cac-ac65-4f75-8052-8d1b5d40dffe",
                        }],
                    "teams": [{
                        "id": "472d17da-ff8b-4743-823f-3f01ea21a349",
                        }],
                    })
        assert response.status_code == 201
        rsp_json = response.json()
        assert rsp_json == {
                'id': rsp_json.get('id'),
                'email': 'new@user.org',
                'is_active': True,
                'is_verified': False,
                'is_superuser': False,
                'first_name': 'new',
                'last_name': 'user',
                'roles': [],
                'teams': [],
                }

    def test_user_update_not_authed(self):
        """Test that users without permission can't update other users."""
        response = self.client.patch(
                f"/users/{self.user_ids['normal']}",
                cookies={'rtauth': get_valid_token("fastapi-users:auth")},
                json={
                    "email": "some@updated.email",
                    })
        assert response.status_code == 401
        assert response.json() == {'detail': 'Unauthorized'}

    def test_user_update_no_perm(self):
        """Test that users without permission can't update other users."""
        for user in ['other', 'normal']:
            response = self.client.patch(
                    f"/users/{self.user_ids['normal']}",
                    cookies={'rtauth': get_valid_token("fastapi-users:auth", user_id=self.user_ids[user])},
                    json={
                        "email": "some@updated.email",
                        })
            assert response.status_code == 403
            assert response.json() == {'detail': 'Forbidden'}

    def test_user_update_basic(self):
        """Test that admins and the user themselves can update their info."""
        response = self.client.patch(
                f"/users/{self.user_ids['normal']}",
                cookies={'rtauth': get_valid_token("fastapi-users:auth", user_id=self.user_ids['admin'])},
                json={
                    "email": "some@updated.email",
                    })
        assert response.status_code == 200
        assert response.json() == {
                'email': 'some@updated.email',
                'first_name': 'Cat',
                'last_name': 'Berry',
                'id': 'cd7e6d44-4b4d-4d7a-8a67-31efffe53e77',
                'is_superuser': False,
                'is_active': True,
                'is_verified': False,
                'roles': [],
                'teams': [{
                    'id': '472d17da-ff8b-4743-823f-3f01ea21a349',
                    'name': 'News Team',
                    }],
                }

    def test_user_update_grant_admin(self):
        """Test that the admin can grant other users the admin role."""
        response = self.client.patch(
                f"/users/{self.user_ids['normal']}",
                cookies={'rtauth': get_valid_token("fastapi-users:auth", user_id=self.user_ids['admin'])},
                json={
                    "roles": [{"id": "be5f8cac-ac65-4f75-8052-8d1b5d40dffe"}],
                    })
        assert response.status_code == 200
        assert response.json() == {
                'email': 'tester@notrealemail.info',
                'first_name': 'Cat',
                'last_name': 'Berry',
                'id': 'cd7e6d44-4b4d-4d7a-8a67-31efffe53e77',
                'is_superuser': True,
                'is_active': True,
                'is_verified': False,
                'roles': [{
                    'id': 'be5f8cac-ac65-4f75-8052-8d1b5d40dffe',
                    'name': 'admin',
                    'description': 'User is an admin and has administrative privileges',
                    }],
                'teams': [{
                    'id': '472d17da-ff8b-4743-823f-3f01ea21a349',
                    'name': 'News Team',
                    }],
                }

    def test_user_cant_give_self_admin(self):
        """Test that normal users can't escalate privileges."""
        response = self.client.patch(
                "/users/me",
                cookies={'rtauth': get_valid_token("fastapi-users:auth", user_id=self.user_ids['normal'])},
                json={
                    "roles": [{"id": "be5f8cac-ac65-4f75-8052-8d1b5d40dffe"}],
                    })
        assert response.json() == {
                'email': 'tester@notrealemail.info',
                'first_name': 'Cat',
                'last_name': 'Berry',
                'id': 'cd7e6d44-4b4d-4d7a-8a67-31efffe53e77',
                'is_superuser': False,
                'is_active': True,
                'is_verified': False,
                'roles': [],
                'teams': [{
                    'id': '472d17da-ff8b-4743-823f-3f01ea21a349',
                    'name': 'News Team',
                    }],
                }
        assert response.status_code == 200

    def test_user_can_verify(self):
        """Test that a user can verify their account through the API."""
        response = self.client.post(
                "/auth/verify",
                json={"token": get_valid_token(
                    "fastapi-users:verify",
                    user_id=self.user_ids['normal'],
                    email="tester@notrealemail.info",
                    )})
        assert response.status_code == 200
        user_response = self.client.get(
                f"/users/{self.user_ids['normal']}",
                cookies={'rtauth': get_valid_token("fastapi-users:auth", user_id=self.user_ids['admin'])})
        assert user_response.json() == {
                'email': 'tester@notrealemail.info',
                'first_name': 'Cat',
                'last_name': 'Berry',
                'id': 'cd7e6d44-4b4d-4d7a-8a67-31efffe53e77',
                'is_superuser': False,
                'is_active': True,
                'is_verified': True,
                'roles': [],
                'teams': [{
                    'id': '472d17da-ff8b-4743-823f-3f01ea21a349',
                    'name': 'News Team',
                    }],
                }
        self.mock_send_email.assert_called_once()
        assert self.mock_send_email.call_args[0][0]["Subject"] == "Your email has been verified!"

    def test_user_can_reset_password(self):
        """Test that a user can reset their password with a token."""
        response = self.client.post(
                "/auth/reset-password",
                json={
                    "token": get_valid_token(
                        "fastapi-users:reset",
                        user_id=self.user_ids['normal'],
                        email="tester@notrealemail.info"),
                    "password": "newpassword",
                    })
        assert response.status_code == 200
        # Check that the password was actually updated
        s = self.Session()
        u = s.query(User).get(self.user_ids['normal'])
        verified, _ = verify_and_update_password("newpassword", u.hashed_password)
        s.close()
        assert verified

    def test_request_verify(self):
        """Test that verification request sends an email."""
        response = self.client.post(
                "/auth/request-verify-token",
                json={"email": "tester@notrealemail.info"})
        assert response.status_code == 202
        self.mock_send_email.assert_called_once()
        assert self.mock_send_email.call_args[0][0]["Subject"] == "Please verify your email address"

    def test_forgot_password(self):
        """Test that a user can request a password reset token."""
        response = self.client.post(
                "/auth/forgot-password",
                json={"email": "tester@notrealemail.info"})
        assert response.status_code == 202
        self.mock_send_email.assert_called_once()
        assert self.mock_send_email.call_args[0][0]["Subject"] == "Your password reset token"



class TestGraphQL(BaseAppTest):
    """Tests for the GraphQL schema, including permissions directives."""

    def setUp(self):
        super().setUp()
        # Create new session for test case to use
        self.session = self.Session()

        # Fetch some users for testing.
        self.test_users = {
                'admin': User.get_by_email(self.session, "admin@notrealemail.info"),
                'normal': User.get_by_email(self.session, "tester@notrealemail.info"),
                'other': User.get_by_email(self.session, "other@notrealemail.info"),
                }

    def tearDown(self):
        self.session.close()
        super().tearDown()


    def run_graphql_query(self, data, user=None):
        """Run a GraphQL query with the given data as the given user.

        :param data: Dict of a GraphQL query
        :param user: User to run query as
        """
        return graphql_sync(
                schema,
                data,
                context_value={
                    'dbsession': self.session,
                    'current_user': user,
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

    def assertResultWasNotAuthed(self, result):
        """Ensure that a GraphQL result contains a NotAuthorized message.

        :param result: GraphQL response dictionary
        """
        self.assertIsNone(result['data'])
        self.assertEqual(len(result['errors']), 1)

    def test_query_user(self):
        """Test queries for a given user.

        Ensures that this query succeeds for the user querying themself and
        also for an admin querying the user.
        """
        for user_role in ['normal', 'admin']:
            user = self.test_users[user_role]
            success, result = self.run_graphql_query({
                "operationName": "QueryUser",
                "query": """
                    query QueryUser($id: ID!) {
                       user(id: $id) {
                          id
                          firstName
                          lastName
                          active
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
            }, user=user)

            # Make sure result is what we expected
            self.assertTrue(success)
            self.assertTrue(self.is_valid_uuid(result["data"]["user"]["id"]), "Invalid UUID")
            self.assertEqual(result, {
                "data": {
                    "user": {
                        "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                        "firstName": "Cat",
                        "lastName": "Berry",
                        "active": True,
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

    def test_query_user_no_perm(self):
        """Check that a different non-admin user can't query another user."""
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
        }, user=self.test_users['other'])

        self.assertTrue(success)
        self.assertResultWasNotAuthed(result)

    def test_query_dataset(self):
        """Test queries for a dataset.

        Tests that the query succeeds for both users on the right team and
        also admin users.
        """
        for user_role in ['normal', 'admin']:
            user = self.test_users[user_role]
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
                                    id
                                    count
                                    inputter {
                                        id
                                        firstName
                                    }
                                    categoryValue {
                                        id
                                        name
                                    }
                                }
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
            }, user=user)

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
                                {
                                    'id': '64677dc1-a1cd-4cd3-965d-6565832d307a',
                                    'count': 1,
                                    'inputter': {
                                        'id': 'cd7e6d44-4b4d-4d7a-8a67-31efffe53e77',
                                        'firstName': 'Cat'
                                    },
                                    "categoryValue": {
                                        "id": "6cae6d26-97e1-4e9c-b1ad-954b4110e83b",
                                        "name": "Non-binary"
                                    }
                                },
                                {
                                    'id': 'a37a5fe2-1493-4cb9-bcd0-a87688ffa409',
                                    'count': 1,
                                    'inputter': {
                                        'id': 'cd7e6d44-4b4d-4d7a-8a67-31efffe53e77',
                                        'firstName': 'Cat'
                                    },
                                    "categoryValue": {
                                        "id": "742b5971-eeb6-4f7a-8275-6111f2342bb4",
                                        "name": "Cisgender women"
                                    }
                                },
                                {
                                    'id': '423dc42f-4628-40e4-b9cd-4e6e9e384d61', 'count': 1,
                                    'inputter': {
                                        'id': 'cd7e6d44-4b4d-4d7a-8a67-31efffe53e77',
                                        'firstName': 'Cat'
                                    },
                                    "categoryValue": {
                                        "id": "d237a422-5858-459c-bd01-a0abdc077e5b",
                                        "name": "Cisgender men"
                                    }
                                },
                                {
                                    'id': '407f24d0-c5eb-4297-9495-90e325a00a1d',
                                    'count': 1,
                                    'inputter': {
                                        'id': 'cd7e6d44-4b4d-4d7a-8a67-31efffe53e77',
                                        'firstName': 'Cat'
                                    },
                                    'categoryValue': {
                                        "id": "662557e5-aca8-4cec-ad72-119ad9cda81b",
                                        "name": "Trans women"
                                    }
                                },
                                {
                                    'id': '4adcb9f9-c1eb-41ba-b9aa-ed0947311a24',
                                    'count': 1,
                                    'inputter': {
                                        'id': 'cd7e6d44-4b4d-4d7a-8a67-31efffe53e77',
                                        'firstName': 'Cat'
                                    },
                                    'categoryValue': {
                                        "id": "1525cce8-7db3-4e73-b5b0-d2bd14777534",
                                        "name": "Trans men"
                                    }
                                },
                                {
                                    'id': '1c49c64f-51e6-48fe-af10-69aaeeddc55f',
                                    'count': 1,
                                    'inputter': {
                                        'id': 'cd7e6d44-4b4d-4d7a-8a67-31efffe53e77',
                                        'firstName': 'Cat'
                                    },
                                    'categoryValue': {
                                        "id": "a72ced2b-b1a6-4d3d-b003-e35e980960df",
                                        "name": "Gender non-conforming"
                                    }
                                },
                                {

                                    "id": "335b3680-13a1-4d8f-a917-01e1e7e1311a",
                                    "count": 1,
                                    'inputter': {
                                        'id': 'cd7e6d44-4b4d-4d7a-8a67-31efffe53e77',
                                        'firstName': 'Cat'
                                    },
                                    "categoryValue": {
                                        "id": "c36958cb-cc62-479e-ab61-eb03896a981c",
                                        "name": "Disabled"
                                    },
                                },
                                {
                                    "count": 1,
                                    "id": "fa5f1f0e-d5ba-4f2d-bdbf-819470a6fa4a",
                                    'inputter': {
                                        'id': 'cd7e6d44-4b4d-4d7a-8a67-31efffe53e77',
                                        'firstName': 'Cat'
                                    },
                                    "categoryValue": {
                                        "id": "55119215-71e9-43ca-b2c1-7e7fb8cec2fd",
                                        "name": "Non-disabled"
                                    },
                                },
                            ]
                        }],
                        "tags": [{
                            "id": "4a2142c0-5416-431d-b62f-0dbfe7574688",
                            "name": "News"
                        }]
                    },
                },
            })

    def test_query_dataset_no_perm(self):
        """Test that a user can't query a dataset if they're not on the team."""
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
                                id
                                count
                                inputter {
                                    id
                                    firstName
                                }
                                categoryValue {
                                    id
                                    name

                                }
                            }
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
        }, user=self.test_users['other'])

        self.assertTrue(success)
        self.assertResultWasNotAuthed(result)

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
                    "tags": [{"name": "Europe", "description": "i am europe", "tagType": "location"}]
                }
            },
        }, user=self.test_users['admin'])

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

    def test_create_dataset_no_perm(self):
        """Test that dataset creation fails for normal (non-admin) users."""
        for user_role in ['other', 'normal']:
            user = self.test_users[user_role]
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
            }, user=user)

            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)

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
        }, user=self.test_users['admin'])

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

    def test_update_dataset_no_perm(self):
        """Test that dataset updates fail for normal (non-admin) users."""
        for user_role in ['other', 'normal']:
            user = self.test_users[user_role]
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
            }, user=user)

            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)

    def test_delete_dataset(self):
        # Confirm Dataset exists, then that it does not.
        dataset_id = "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89"
        existing_dataset= self.session.query(Dataset).filter(Dataset.id == dataset_id, Dataset.deleted == None)
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
        }, user=self.test_users['admin'])

        self.assertTrue(success)
        # Query for all associated Records
        associated_records = self.session.query(Record).filter(Record.dataset_id == dataset_id, Record.deleted == None)
        # Compile list of associated Record IDs
        associated_record_ids = [record.id for record in associated_records]
        # Query for non-deleted Entries associated with each Record id
        existing_entries = self.session.query(Entry).filter(Entry.record_id.in_(associated_record_ids), Entry.deleted == None)
        # Querying for non-deleted associated Records
        existing_records = associated_records.filter(Record.deleted == None)
        # Count of non-deleted records, and entries should be zero
        self.assertEqual(existing_entries.count(), 0)
        self.assertEqual(existing_records.count(), 0)
        self.assertTrue(self.is_valid_uuid(dataset_id), "Invalid UUID")

        self.assertEqual(result, {
            "data": {
                "deleteDataset": dataset_id
            },
        })

    def test_delete_dataset_no_perm(self):
        """Test that dataset deletes fail for normal (non-admin) users."""
        for user_role in ['other', 'normal']:
            user = self.test_users[user_role]
            # Confirm Dataset exists, then that it does not.
            dataset_id = "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89"
            existing_dataset = self.session.query(Dataset).filter(Dataset.id == dataset_id)
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
            }, user=user)

            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)
            # Verify nothing was deleted
            existing_dataset = self.session.query(Dataset).filter(Dataset.id == dataset_id)
            self.assertEqual(existing_dataset.count(), 1)

    def test_query_record(self):
        """Test that dataset records can be queried.

        Users on the right team and admins should be able to query records.
        """
        for user_role in ['admin', 'normal']:
            user = self.test_users[user_role]
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
                                categoryValue {
                                    id
                                    name
                                }
                            }
                       }
                    }
                """,
                "variables": {
                    "id": "742b5971-eeb6-4f7a-8275-6111f2342bb4",
                },
            }, user=user)

            self.assertTrue(success)
            self.assertEqual(result, {
                "data": {
                    "record": {
                        "id" : "742b5971-eeb6-4f7a-8275-6111f2342bb4",
                        "publicationDate": "2020-12-21T00:00:00",
                        "dataset": {"id": "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89"},
                        "entries": [
                            {"categoryValue": {
                                "id": "6cae6d26-97e1-4e9c-b1ad-954b4110e83b",
                                "name": "Non-binary"
                            }},
                            {"categoryValue": {
                                "id": "742b5971-eeb6-4f7a-8275-6111f2342bb4",
                                "name": "Cisgender women"
                            }},
                            {"categoryValue": {
                                "id": "d237a422-5858-459c-bd01-a0abdc077e5b",
                                "name": "Cisgender men"
                            }},
                            {'categoryValue': {
                                "id": "662557e5-aca8-4cec-ad72-119ad9cda81b",
                                "name": "Trans women"
                            }},
                            {'categoryValue': {
                                "id": "1525cce8-7db3-4e73-b5b0-d2bd14777534",
                                "name": "Trans men"
                            }},
                            {'categoryValue': {
                                "id": "a72ced2b-b1a6-4d3d-b003-e35e980960df",
                                "name": "Gender non-conforming"
                            }},
                            {"categoryValue": {
                                "id": "c36958cb-cc62-479e-ab61-eb03896a981c",
                                "name": "Disabled"
                            }},
                            {"categoryValue": {
                                "id": "55119215-71e9-43ca-b2c1-7e7fb8cec2fd",
                                "name": "Non-disabled"
                            }},
                        ]
                    },
                },
            })

    def test_query_record_no_perm(self):
        """Test that dataset records can't be queried by users on the wrong team."""
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
                            categoryValue {
                                id
                                name
                            }
                        }
                   }
                }
            """,
            "variables": {
                "id": "742b5971-eeb6-4f7a-8275-6111f2342bb4",
            },
        }, user=self.test_users['other'])

        self.assertTrue(success)
        self.assertResultWasNotAuthed(result)

    def test_create_record(self):
        """Test that admins and users on the right team can create records."""
        for user_role in ['admin', 'normal']:
            self.setUp()
            user = self.test_users[user_role]
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
                                count
                                categoryValue {
                                    id
                                    name
                                }
                                inputter {
                                    id
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
                            "count":  7,
                            "categoryValueId": "662557e5-aca8-4cec-ad72-119ad9cda81b",
                        }],
                    }
                },
            }, user=user)

            self.assertTrue(success)
            self.assertTrue(self.is_valid_uuid(result["data"]["createRecord"]["id"]), "Invalid UUID")
            self.assertEqual(result, {
                "data": {
                    "createRecord": {
                        "id": result["data"]["createRecord"]["id"],
                        "publicationDate": "2020-12-22T00:00:00",
                        "dataset": {"id": "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89", "name": "Breakfast Hour"},
                        'entries': [{
                            'count': 7,
                            'categoryValue': {
                                "id": "662557e5-aca8-4cec-ad72-119ad9cda81b",
                                "name": "Trans women"
                            },
                            "inputter": {"id": str(user.id)}
                        }],
                    },
                },
            })

            self.tearDown()

    def test_create_record_no_perm(self):
        """Test that users of other teams can't create records"""
        user = self.test_users['other']
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
                            count
                            categoryValue {
                                id
                                name
                            }
                            inputter {
                                id
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
                        "count":  7,
                        "categoryValueId": "662557e5-aca8-4cec-ad72-119ad9cda81b",
                        "inputterId": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                    }],
                }
            },
        }, user=user)

        self.assertTrue(success)
        self.assertResultWasNotAuthed(result)

    def test_update_record(self):
        """Test that users on a team / admins can update records."""
        for user_role in ['admin', 'normal']:
            user = self.test_users[user_role]
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
                                categoryValue {
                                    id
                                    name
                                    category {
                                        id
                                        name
                                    }
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
                            "categoryValueId": "6cae6d26-97e1-4e9c-b1ad-954b4110e83b",
                            "count": 0
                            }
                        ]
                    }
                },
            }, user=user)

            self.assertTrue(success)
            self.assertTrue(self.is_valid_uuid(result["data"]["updateRecord"]["id"]), "Invalid UUID")

            self.assertEqual(result, {
                "data": {
                    "updateRecord": {
                        "id": "742b5971-eeb6-4f7a-8275-6111f2342bb4",
                        "publicationDate": "2020-12-25T00:00:00",
                        "dataset": {"id": "96336531-9245-405f-bd28-5b4b12ea3798", "name": "12PM - 4PM"},
                        "entries": [
                            {"count": 0, "categoryValue": {"id": "6cae6d26-97e1-4e9c-b1ad-954b4110e83b", "name": "Non-binary", "category": {"id": "51349e29-290e-4398-a401-5bf7d04af75e", "name": "Gender"}}},
                            {"count": 1, "categoryValue": {"id": "742b5971-eeb6-4f7a-8275-6111f2342bb4", "name": "Cisgender women", "category": {"id": "51349e29-290e-4398-a401-5bf7d04af75e", "name": "Gender"}}},
                            {"count": 1, "categoryValue": {"id": "d237a422-5858-459c-bd01-a0abdc077e5b", "name": "Cisgender men", "category": {"id": "51349e29-290e-4398-a401-5bf7d04af75e", "name": "Gender"}}},
                            {"count": 1, "categoryValue": {"id": "662557e5-aca8-4cec-ad72-119ad9cda81b", "name": "Trans women", "category": {"id": "51349e29-290e-4398-a401-5bf7d04af75e", "name": "Gender"}}},
                            {"count": 1, "categoryValue": {"id": "1525cce8-7db3-4e73-b5b0-d2bd14777534", "name": "Trans men", "category": {"id": "51349e29-290e-4398-a401-5bf7d04af75e", "name": "Gender"}}},
                            {"count": 1, "categoryValue": {"id": "a72ced2b-b1a6-4d3d-b003-e35e980960df", "name": "Gender non-conforming", "category": {"id": "51349e29-290e-4398-a401-5bf7d04af75e", "name": "Gender"}}},
                            {"count": 1, "categoryValue": {"id": "c36958cb-cc62-479e-ab61-eb03896a981c", "name": "Disabled", "category": {"id": "55119215-71e9-43ca-b2c1-7e7fb8cec2fd", "name": "Disability"}}},
                            {"count": 1, "categoryValue": {"id": "55119215-71e9-43ca-b2c1-7e7fb8cec2fd", "name": "Non-disabled", "category": {"id": "55119215-71e9-43ca-b2c1-7e7fb8cec2fd", "name": "Disability"}}},
                        ]
                    },
                },
            })

    def test_update_record_no_perm(self):
        """Test that users on other teams can't update records."""
        user = self.test_users['other']
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
                            categoryValue {
                                id
                                name
                                category {
                                    id
                                    name
                                }

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
                        "categoryValueId": "6cae6d26-97e1-4e9c-b1ad-954b4110e83b",
                        "inputterId": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                        "count": 0
                        }
                    ]
                }
            },
        }, user=user)

        self.assertTrue(success)
        self.assertResultWasNotAuthed(result)

    def test_delete_record(self):
        """Test that users on a team and admins can delete records."""
        for user_role in ['admin', 'normal']:
            self.setUp()
            user = self.test_users[user_role]
            # Confirm Record exists, then that it does not.
            record_id = "742b5971-eeb6-4f7a-8275-6111f2342bb4"
            existing_record = Record.get_not_deleted(self.session, record_id)
            # Count of non-deleted records should not be None
            self.assertNotEqual(existing_record, None)
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
            }, user=user)

            self.assertTrue(success)
            # Query for Records that were not deleted
            record = Record.get_not_deleted(self.session, record_id)
            # Record should be None
            self.assertEqual(record, None)
            # Query for all associated Entries
            associated_entries = self.session.query(Entry).filter(Entry.record_id == record_id, Entry.deleted == None)
            # Entries count should be zero
            self.assertEqual(associated_entries.count(), 0)
            self.assertTrue(self.is_valid_uuid(record_id), "Invalid UUID")
            self.assertEqual(result, {
                "data": {
                    "deleteRecord": record_id
                },
            })
            self.tearDown()


    def test_delete_record_no_perm(self):
        """Test that users on a different team can't delete a record."""
        user = self.test_users['other']
        # Confirm Record exists, then that it does not.
        record_id = "742b5971-eeb6-4f7a-8275-6111f2342bb4"
        existing_record = Record.get_not_deleted(self.session, record_id)
        # Count of non-deleted records should not be None
        self.assertNotEqual(existing_record, None)
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
        }, user=user)

        self.assertTrue(success)
        self.assertResultWasNotAuthed(result)
        # Query for Record
        existing_record = Record.get_not_deleted(self.session, record_id)
        # Count of non-deleted records should still not be None
        self.assertNotEqual(existing_record, None)

    def test_query_category(self):
        """Test that anyone can query a category."""
        for user_role in ["admin", "normal", "other"]:
            user = self.test_users[user_role]
            success, result = self.run_graphql_query({
                "operationName": "QueryCategory",
                "query": """
                    query QueryCategory($id: ID!) {
                       category(id: $id) {
                            id
                            name
                       }
                    }
                """,
                "variables": {
                    "id": "51349e29-290e-4398-a401-5bf7d04af75e",
                },
            }, user=user)

            self.assertTrue(success)
            self.assertEqual(result, {
                "data": {
                    "category": {
                        "id" : "51349e29-290e-4398-a401-5bf7d04af75e",
                        "name": "Gender"
                    },
                },
            })

    def test_create_category(self):
        """Test that the admin can create a category."""
        success, result = self.run_graphql_query({
            "operationName": "CreateCategory",
            "query": """
                mutation CreateCategory($input: CreateCategoryInput!) {
                   createCategory(input: $input) {
                        id
                        name
                        description
                   }
                }
            """,
            "variables": {
                "input": {
                    "name": "Ethnicity",
                    "description": "Ethnicity is..."
                }
            },
        }, user=self.test_users['admin'])
        self.assertTrue(success)
        self.assertTrue(self.is_valid_uuid(result["data"]["createCategory"]["id"]), "Invalid UUID")
        self.assertEqual(result, {
            "data": {
                "createCategory": {
                    "id": result["data"]["createCategory"]["id"],
                    "name": "Ethnicity",
                    "description": "Ethnicity is..."
                },
            },
        })

    def test_create_category_no_perm(self):
        """Test that non-admins can not create a category."""
        for user_role in ["normal", "other"]:
            user = self.test_users[user_role]
            success, result = self.run_graphql_query({
                "operationName": "CreateCategory",
                "query": """
                    mutation CreateCategory($input: CreateCategoryInput!) {
                       createCategory(input: $input) {
                            id
                            name
                            description
                       }
                    }
                """,
                "variables": {
                    "input": {
                        "name": "Ethnicity",
                        "description": "Ethnicity is..."
                    }
                },
            }, user=user)
            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)

    def test_update_category(self):
        """Test that the admin can update categories."""
        success, result = self.run_graphql_query({
            "operationName": "UpdateCategory",
            "query": """
                mutation UpdateCategory($input: UpdateCategoryInput!) {
                   updateCategory(input: $input) {
                        id
                        name
                        description
                   }
                }
            """,
            "variables": {
                "input": {
                    "id": "51349e29-290e-4398-a401-5bf7d04af75e",
                    "name": "Disability",
                    "description": "Disability is ..."
                }
            },
        }, self.test_users["admin"])
        self.assertTrue(success)
        self.assertTrue(self.is_valid_uuid(result["data"]["updateCategory"]["id"]), "Invalid UUID")
        self.assertEqual(result, {
            "data": {
                "updateCategory": {
                    "id": "51349e29-290e-4398-a401-5bf7d04af75e",
                    "name": "Disability",
                    "description": "Disability is ..."
                },
            },
        })

    def test_update_category_no_perm(self):
        """Test that users other than admin can not update categories."""
        for user_role in ["normal", "other"]:
            user = self.test_users[user_role]
            success, result = self.run_graphql_query({
                "operationName": "UpdateCategory",
                "query": """
                    mutation UpdateCategory($input: UpdateCategoryInput!) {
                       updateCategory(input: $input) {
                            id
                            name
                            description
                       }
                    }
                """,
                "variables": {
                    "input": {
                        "id": "51349e29-290e-4398-a401-5bf7d04af75e",
                        "name": "Disability",
                        "description": "Disability is ..."
                    }
                },
            }, user=user)
            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)

    def test_delete_category(self):
        """Test that admin can delete a category."""
        user = self.test_users["admin"]
        category_id = "51349e29-290e-4398-a401-5bf7d04af75e"
        # Confirm Category exists, then that it does not.
        existing_category = self.session.query(Category).filter(Category.id == category_id, Category.deleted == None)
        # Count of existing Category should be one
        self.assertEqual(existing_category.count(), 1)
        success, result = self.run_graphql_query({
            "operationName": "DeleteCategory",
            "query": """
                mutation DeleteCategory($id: ID!) {
                    deleteCategory(id: $id)
                }
            """,
            "variables": {
                "id": category_id,
            },
        }, user=user)
        self.assertTrue(success)
        category = self.session.query(Category).filter(Category.id == category_id, Category.deleted == None)
        self.assertEqual(category.count(), 0)
        self.assertTrue(self.is_valid_uuid(category_id), "Invalid UUID")
        self.assertEqual(result, {
            "data": {
                "deleteCategory": category_id
            },
        })

    def test_delete_category_no_perm(self):
        """Test that non-admins can not delete a category."""
        for user_role in ["normal", "other"]:
            user = self.test_users[user_role]
            category_id = "51349e29-290e-4398-a401-5bf7d04af75e"
            # Confirm Category exists, then that it does not.
            existing_category = self.session.query(Category).filter(Category.id == category_id, Category.deleted == None)
            # Count of existing Category should be one
            self.assertEqual(existing_category.count(), 1)
            success, result = self.run_graphql_query({
                "operationName": "DeleteCategory",
                "query": """
                    mutation DeleteCategory($id: ID!) {
                        deleteCategory(id: $id)
                    }
                """,
                "variables": {
                    "id": category_id,
                },
            }, user=user)
            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)
            category = self.session.query(Category).filter(Category.id == category_id, Category.deleted == None)
            self.assertEqual(category.count(), 1)

    def test_query_category_value(self):
        """Test that anyone can query category values"""
        for user_role in ["normal", "other"]:
            user = self.test_users[user_role]
            success, result = self.run_graphql_query({
                "operationName": "QueryCategoryValue",
                "query": """
                    query QueryCategoryValue($id: ID!) {
                       categoryValue(id: $id) {
                            id
                            name
                       }
                    }
                """,
                "variables": {
                    "id": "742b5971-eeb6-4f7a-8275-6111f2342bb4",
                },
            }, user=user)

            self.assertTrue(success)
            self.assertEqual(result, {
                "data": {
                    "categoryValue": {
                        "id" : "742b5971-eeb6-4f7a-8275-6111f2342bb4",
                        "name": "Cisgender women"
                    },
                },
            })

    def test_create_category_value(self):
        """Test that only admins can create category values."""
        user = self.test_users["admin"]
        success, result = self.run_graphql_query({
            "operationName": "CreateCategoryValue",
            "query": """
                mutation CreateCategoryValue($input: CreateCategoryValueInput!) {
                   createCategoryValue(input: $input) {
                        id
                        name
                        category {
                            id
                            name
                        }
                   }
                }
            """,
            "variables": {
                "input": {
                    "name": "questioning",
                    "categoryId": "51349e29-290e-4398-a401-5bf7d04af75e"
                }
            },
        }, user=user)
        self.assertTrue(success)
        self.assertTrue(self.is_valid_uuid(result["data"]["createCategoryValue"]["id"]), "Invalid UUID")
        self.assertEqual(result, {
            "data": {
                "createCategoryValue": {
                    "id": result["data"]["createCategoryValue"]["id"],
                    "name": "Questioning",
                    "category": {
                        "id": "51349e29-290e-4398-a401-5bf7d04af75e",
                        "name": "Gender"
                    }
                },
            },
        })

    def test_create_category_value_no_perm(self):
        """Test that non-admins can not create category values."""
        for user in ["normal", "other"]:
            user = self.test_users[user]
            success, result = self.run_graphql_query({
                "operationName": "CreateCategoryValue",
                "query": """
                    mutation CreateCategoryValue($input: CreateCategoryValueInput!) {
                       createCategoryValue(input: $input) {
                            id
                            name
                            category {
                                id
                                name
                            }
                       }
                    }
                """,
                "variables": {
                    "input": {
                        "name": "questioning",
                        "categoryId": "51349e29-290e-4398-a401-5bf7d04af75e"
                    }
                },
            }, user=user)
            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)

    def test_update_category_value(self):
        """Only admins can update category values"""
        user = self.test_users["admin"]
        success, result = self.run_graphql_query({
            "operationName": "UpdateCategoryValue",
            "query": """
                mutation UpdateCategoryValue($input: UpdateCategoryValueInput!) {
                   updateCategoryValue(input: $input) {
                        id
                        name
                        category {
                            id
                            name
                        }
                   }
                }
            """,
            "variables": {
                "input": {
                    "id": "662557e5-aca8-4cec-ad72-119ad9cda81b",
                    "name": "transgender woman"
                }
            },
        }, user=user)
        self.assertTrue(success)
        self.assertTrue(self.is_valid_uuid(result["data"]["updateCategoryValue"]["id"]), "Invalid UUID")
        self.assertEqual(result, {
            "data": {
                "updateCategoryValue": {
                    "id": "662557e5-aca8-4cec-ad72-119ad9cda81b",
                    "name": "Transgender woman",
                    "category": {
                        "id": "51349e29-290e-4398-a401-5bf7d04af75e",
                        "name": "Gender"
                    }
                },
            },
        })

    def test_update_category_value_no_perm(self):
        """Only admins can update category values"""
        for user in ["normal", "other"]:
            user = self.test_users[user]
            success, result = self.run_graphql_query({
                "operationName": "UpdateCategoryValue",
                "query": """
                    mutation UpdateCategoryValue($input: UpdateCategoryValueInput!) {
                       updateCategoryValue(input: $input) {
                            id
                            name
                            category {
                                id
                                name
                            }
                       }
                    }
                """,
                "variables": {
                    "input": {
                        "id": "662557e5-aca8-4cec-ad72-119ad9cda81b",
                        "name": "transgender woman"
                    }
                },
            }, user=user)
            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)

    def test_delete_category_value(self):
        """Only admins can delete category values."""
        user = self.test_users["admin"]
        category_value_id = "0034d015-0652-497d-ab4a-d42b0bdf08cb"
        # Confirm Value exists, then that it does not.
        existing_category_value = self.session.query(CategoryValue).filter(CategoryValue.id == category_value_id, CategoryValue.deleted == None)
        # Count of existing CategoryValue should be one
        self.assertEqual(existing_category_value.count(), 1)
        success, result = self.run_graphql_query({
            "operationName": "DeleteCategoryValue",
            "query": """
                mutation DeleteCategoryValue($id: ID!) {
                    deleteCategoryValue(id: $id)
                }
            """,
            "variables": {
                "id": category_value_id,
            },
        }, user=user)
        self.assertTrue(success)
        category_value = self.session.query(CategoryValue).filter(CategoryValue.id == category_value_id, CategoryValue.deleted == None)
        self.assertEqual(category_value.count(), 0)
        self.assertTrue(self.is_valid_uuid(category_value_id), "Invalid UUID")
        self.assertEqual(result, {
            "data": {
                "deleteCategoryValue": category_value_id
            },
        })

    def test_delete_category_value_no_perm(self):
        """Only admins can delete category values."""
        for user in ["normal", "other"]:
            user = self.test_users[user]
            category_value_id = "0034d015-0652-497d-ab4a-d42b0bdf08cb"
            # Confirm Value exists, then that it does not.
            existing_category_value = self.session.query(CategoryValue).filter(CategoryValue.id == category_value_id, CategoryValue.deleted == None)
            # Count of existing CategoryValue should be one
            self.assertEqual(existing_category_value.count(), 1)
            success, result = self.run_graphql_query({
                "operationName": "DeleteCategoryValue",
                "query": """
                    mutation DeleteCategoryValue($id: ID!) {
                        deleteCategoryValue(id: $id)
                    }
                """,
                "variables": {
                    "id": category_value_id,
                },
            }, user=user)
            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)
            category_value = self.session.query(CategoryValue).filter(CategoryValue.id == category_value_id, CategoryValue.deleted == None)
            self.assertEqual(category_value.count(), 1)

    def test_query_team(self):
        """Test that anyone can query teams"""
        for user_role in ["normal"]:
            user = self.test_users[user_role]
            success, result = self.run_graphql_query({
                "operationName": "QueryTeam",
                "query": """
                    query QueryTeam($id: ID!) {
                       team(id: $id) {
                            id
                            name
                       }
                    }
                """,
                "variables": {
                    "id": "472d17da-ff8b-4743-823f-3f01ea21a349",
                },
            }, user=user)

            self.assertTrue(success)
            self.assertEqual(result, {
                "data": {
                    "team": {
                        "id" : "472d17da-ff8b-4743-823f-3f01ea21a349",
                        "name": "News Team"
                    },
                },
            })
                                        
    def test_create_team(self):
        """Test that the admin can create a team."""
        success, result = self.run_graphql_query({
            "operationName": "CreateTeam",
            "query": """
                mutation CreateTeam($input: CreateTeamInput!) {
                   createTeam(input: $input) {
                        id
                        name
                        users {
                            id
                            firstName
                        }
                        programs {
                            id
                            name
                        }
                        organization {
                            name
                        }
                   }
                }
            """,
            "variables": {
                "input": {
                    "name": "The Best Team!",
                    "userIds": ["cd7e6d44-4b4d-4d7a-8a67-31efffe53e77"],
                    "programIds": ["1e73e788-0808-4ee8-9b25-682b6fa3868b"],
                    "organizationId": "15d89a19-b78d-4ee8-b321-043f26bdd48a"
                }
            },
        }, user=self.test_users['admin'])
        self.assertTrue(success)
        print(f'{result}, resultoooo')
        self.assertTrue(self.is_valid_uuid(result["data"]["createTeam"]["id"]), "Invalid UUID")
        self.assertEqual(result, {
            "data": {
                "createTeam": {
                    "id": result["data"]["createTeam"]["id"],
                    "name": "The Best Team!",
                    "users": [{
                        "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                        "firstName": "Cat"
                    }],
                    "programs": [{
                        "id": "1e73e788-0808-4ee8-9b25-682b6fa3868b",
                        "name": "BBC News"
                    }],
                    "organization": {
                        "name": "BBC"
                    }
                },
            },
        })

    def test_create_teams_no_perm(self):
        """Test that non-admins can not create a team."""
        for user_role in ["normal", "other"]:
            user = self.test_users[user_role]
            success, result = self.run_graphql_query({
                "operationName": "CreateTeam",
                "query": """
                    mutation CreateTeam($input: CreateTeamInput!) {
                       createTeam(input: $input) {
                            id
                            name
                            users {
                                id
                                firstName
                            }
                            programs {
                                id
                                name
                            }
                            organization {
                                name
                            }
                       }
                    }
                """,
                "variables": {
                    "input": {
                        "name": "The Best Team!",
                        "userIds": ["cd7e6d44-4b4d-4d7a-8a67-31efffe53e77"],
                        "programIds": ["1e73e788-0808-4ee8-9b25-682b6fa3868b"],
                        "organizationId": "15d89a19-b78d-4ee8-b321-043f26bdd48a"
                    }   
                },
            }, user=user)
            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)
            
    def test_update_team(self):
        """Only admins can update teams"""
        user = self.test_users["admin"]
        success, result = self.run_graphql_query({
            "operationName": "UpdateTeam",
            "query": """
                mutation UpdateTeam($input: UpdateTeamInput!) {
                   updateTeam(input: $input) {
                        id
                        name
                   }
                }
            """,
            "variables": {
                "input": {
                    "id": "472d17da-ff8b-4743-823f-3f01ea21a349",
                    "name": "New Name"
                }
            },
        }, user=user)
        self.assertTrue(success)
        self.assertEqual(result, {
            "data": {
                "updateTeam": {
                    "id": "472d17da-ff8b-4743-823f-3f01ea21a349",
                    "name": "New Name"
                },
            },
        })

    def test_update_team_no_perm(self):
        """Only admins can update teams"""
        for user in ["normal", "other"]:
            user = self.test_users[user]
            success, result = self.run_graphql_query({
                "operationName": "UpdateTeam",
                "query": """
                    mutation UpdateTeam($input: UpdateTeamInput!) {
                       updateTeam(input: $input) {
                            id
                            name
                       }
                    }
                """,
                "variables": {
                    "input": {
                        "id": "472d17da-ff8b-4743-823f-3f01ea21a349",
                        "name": "New new name"
                    }
                },
            }, user=user)
            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)

    def test_delete_team(self):
        """Only admins can delete teams."""
        user = self.test_users["admin"]
        team_id = "472d17da-ff8b-4743-823f-3f01ea21a349"
        # Confirm Team exists, then that it does not.
        existing_team = self.session.query(Team).filter(Team.id == team_id)
        # Count of existing Team should be one
        self.assertEqual(existing_team.count(), 1)
        success, result = self.run_graphql_query({
            "operationName": "DeleteTeam",
            "query": """
                mutation DeleteTeam($id: ID!) {
                    deleteTeam(id: $id)
                }
            """,
            "variables": {
                "id": team_id,
            },
        }, user=user)
        self.assertTrue(success)
        team = self.session.query(Team).filter(Team.id == team_id)
        self.assertEqual(team.count(), 0)
        program = self.session.query(Program).filter(Program.team_id == team_id)
        self.assertEqual(program.count(), 0)
        # Adding raw SQL query to hit join table
        query = sqlalchemy.text(f'SELECT * FROM user_team WHERE team_id = "{team_id}"')
        user_teams = self.session.execute(query).fetchall()
        self.assertEqual(len(user_teams), 0)
        
        self.assertTrue(self.is_valid_uuid(team_id), "Invalid UUID")
        self.assertEqual(result, {
            "data": {
                "deleteTeam": team_id
            },
        })

    def test_delete_team_no_perm(self):
        """Only admins can delete teams."""
        for user in ["normal", "other"]:
            user = self.test_users[user]
            team_id = "472d17da-ff8b-4743-823f-3f01ea21a349"
            # Confirm Team exists, then that it does not.
            existing_team = self.session.query(Team).filter(Team.id == team_id)
            # Count of existing Team should be one
            self.assertEqual(existing_team.count(), 1)
            success, result = self.run_graphql_query({
                "operationName": "DeleteTeam",
                "query": """
                    mutation DeleteTeam($id: ID!) {
                        deleteTeam(id: $id)
                    }
                """,
                "variables": {
                    "id": team_id,
                },
            }, user=user)
            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)
            team = self.session.query(Team).filter(Team.id == team_id)
            self.assertEqual(team.count(), 1)
            program = self.session.query(Program).filter(Program.team_id == team_id)
            self.assertEqual(program.count(), 1)
            # Adding raw SQL query to hit join table
            query = sqlalchemy.text(f'SELECT * FROM user_team WHERE team_id = "{team_id}"')
            user_teams = self.session.execute(query).fetchall()
            self.assertEqual(len(user_teams), 1)

    def test_get_users(self):
        """Admins can fetch a full list of users, other users cannot."""
        # List of users and expected authorization response. True means the
        # response should succeed, False means it should not be authorized.
        users = [
                ["admin", True],
                ["other", False],
                ["normal", False],
                [None, False],
                ]

        for user_name, should_auth in users:
            user = self.test_users[user_name] if user_name else None
            success, result = self.run_graphql_query({
                "operationName": "GetUsers",
                "query": """
                    query GetUsers {
                        users {
                            email
                            active
                        }
                    }
                """,
            }, user=user)
            assert success
            if should_auth:
                assert result == {
                        "data": {
                            "users": [
                                {"email": "admin@notrealemail.info", "active": True},
                                {"email": "other@notrealemail.info", "active": True},
                                {"email": "tester@notrealemail.info", "active": True},
                                ],
                            },
                        }
            else:
                self.assertResultWasNotAuthed(result)

    def test_get_teams(self):
        """Admins can fetch a full list of teams, other users cannot."""
        # List of users and expected authorization response. True means the
        # response should succeed, False means it should not be authorized.
        users = [
                ["admin", True],
                ["other", False],
                ["normal", False],
                [None, False],
                ]

        for user_name, should_auth in users:
            user = self.test_users[user_name] if user_name else None
            success, result = self.run_graphql_query({
                "operationName": "GetTeams",
                "query": """
                    query GetTeams {
                        teams {
                            name
                        }
                    }
                """,
            }, user=user)
            assert success
            if should_auth:
                assert result == {
                        "data": {
                            "teams": [
                                {"name": "News Team"},
                                ],
                            },
                        }
            else:
                self.assertResultWasNotAuthed(result)

    def test_get_roles(self):
        """Admins can fetch a full list of roles, other users cannot."""
        # List of users and expected authorization response. True means the
        # response should succeed, False means it should not be authorized.
        users = [
                ["admin", True],
                ["other", False],
                ["normal", False],
                [None, False],
                ]

        for user_name, should_auth in users:
            user = self.test_users[user_name] if user_name else None
            success, result = self.run_graphql_query({
                "operationName": "GetRoles",
                "query": """
                    query GetRoles {
                        roles {
                            name
                        }
                    }
                """,
            }, user=user)
            assert success
            if should_auth:
                assert result == {
                        "data": {
                            "roles": [
                                {"name": "admin"},
                                ],
                            },
                        }
            else:
                self.assertResultWasNotAuthed(result)

    def test_create_program(self):
        success, result = self.run_graphql_query({
            "operationName": "CreateProgram",
            "query": """
                mutation CreateProgram($input: CreateProgramInput!) {
                   createProgram(input: $input) {
                        id
                        name
                        description
                        team {
                            name
                        }
                        datasets {
                            name
                        }
                        targets {
                            target
                        }
                    }
                }        
            """,
            "variables": {
                "input": {
                    "name": "A New Program!",
                    "description": "A very new program",
                    "teamId": "472d17da-ff8b-4743-823f-3f01ea21a349",
                    "datasetIds": ["b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89"],
                    "targetIds": ["b5be10ce-103f-41f2-b4c4-603228724993", "6e6edce5-3d24-4296-b929-5eec26d52afc"],
                    "tagIds": ["4a2142c0-5416-431d-b62f-0dbfe7574688"]
                }
            },
        }, user=self.test_users['admin'])

        self.assertTrue(success)
        print(f'{result}, result here')
        self.assertTrue(self.is_valid_uuid(result["data"]["createProgram"]["id"]), "Invalid UUID")
        self.assertEqual(result, {
            "data": {
                "createProgram": {
                    "id": result["data"]["createProgram"]["id"],
                    "name": "A New Program!",
                    "description": "A very new program",
                    "team": {
                        "name": "News Team"
                    },
                    "datasets": [{"name": "Breakfast Hour"}], 
                    "targets": [{"target": 0.5}, {"target": 0.5}],
                },
            },
        })

if __name__ == '__main__':
    unittest.main()
