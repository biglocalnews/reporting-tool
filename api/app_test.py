import unittest
import sqlalchemy
from unittest.mock import Mock, patch

from fastapi_users.utils import generate_jwt, JWT_ALGORITHM
from fastapi_users.password import verify_and_update_password
from fastapi.testclient import TestClient
from ariadne import graphql_sync, graphql
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import schema, app
from user import user_db, cookie_authentication, get_valid_token
from database import (
    clear_cached_state,
    Base,
    create_tables,
    Organization,
    create_dummy_data,
    Record,
    Entry,
    Dataset,
    Category,
    CategoryValue,
    User,
    Team,
    Program,
    Target,
)
from uuid import UUID


class BaseAppTest(unittest.IsolatedAsyncioTestCase):
    """Base test runner that sets up an in-memory database that test cases can
    make assertions against.
    """

    # Get full diff outuput
    maxDiff = None

    def setUp(self, with_dummy_data=True):
        # Create in-memory sqlite database. This is configured to work with
        # multithreaded environments, so it can be used safely with the real
        # FastAPI app instance.
        self.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )

        # Turn on foreign keys to emulate Postgres better (without this things
        # like cascading deletes won't work)
        self.engine.execute("PRAGMA foreign_keys = ON")
        Session = sessionmaker(bind=self.engine)
        session = Session()

        clear_cached_state()
        create_tables(session)
        if with_dummy_data:
            create_dummy_data(session)

        session.close()

        # Expose the session maker so a test can make one
        self.Session = Session
        user_db.session_factory = self.Session

        # Mock the email sender
        self.send_email_patch = patch("mailer.send_email")
        self.mock_send_email = self.send_email_patch.start()

    def tearDown(self):
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()
        self.send_email_patch.stop()


class TestAppUsers(BaseAppTest):
    """Test /users/ API routes."""

    def setUp(self, *args, **kwargs):
        super().setUp(*args, **kwargs)

        # Mock out database objects to use in-memory DB.
        app.extra["database"] = Mock()
        app.extra["get_db_session"] = self.Session

        # Set up Starlette test client
        self.client = TestClient(app)

        # A few user fixtures to use for testing different scenarios
        self.user_ids = {
            "normal": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
            "admin": "df6413b4-b910-4f6e-8f3c-8201c9e65af3",
            "other": "a47085ba-3d01-46a4-963b-9ffaeda18113",
        }

    def test_users_me_not_authed(self):
        """Checks that route returns error when user is not authed."""
        response = self.client.get("/users/me")
        assert response.status_code == 401
        assert response.json() == {"detail": "Unauthorized"}

    def test_users_me_first_time(self):
        """Checks that when the app is not configured this throws a 418."""
        # Reset the database with no dummy data
        self.tearDown()
        self.setUp(with_dummy_data=False)

        response = self.client.get("/users/me")
        assert response.status_code == 418

    def test_users_me_normal(self):
        """Checks that a user can get info about themselves."""
        response = self.client.get(
            "/users/me",
            cookies={
                "rtauth": get_valid_token(
                    "fastapi-users:auth", user_id=self.user_ids["normal"]
                )
            },
        )
        assert response.status_code == 200
        assert response.json() == {
            "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
            "email": "tester@notrealemail.info",
            "first_name": "Cat",
            "last_name": "Berry",
            "is_active": True,
            "is_verified": False,
            "is_superuser": False,
            "last_login": None,
            "last_changed_password": None,
            "roles": [],
            "teams": [
                {"id": "472d17da-ff8b-4743-823f-3f01ea21a349", "name": "News Team"}
            ],
        }

    def test_users_me_admin(self):
        """Checks that an admin user can get info about themselves."""
        response = self.client.get(
            "/users/me",
            cookies={
                "rtauth": get_valid_token(
                    "fastapi-users:auth", user_id=self.user_ids["admin"]
                )
            },
        )
        assert response.status_code == 200
        assert response.json() == {
            "id": "df6413b4-b910-4f6e-8f3c-8201c9e65af3",
            "email": "admin@notrealemail.info",
            "first_name": "Daisy",
            "last_name": "Carrot",
            "is_active": True,
            "is_verified": False,
            "is_superuser": True,
            "last_login": None,
            "last_changed_password": None,
            "roles": [
                {
                    "id": "be5f8cac-ac65-4f75-8052-8d1b5d40dffe",
                    "description": "User is an admin and has administrative privileges",
                    "name": "admin",
                }
            ],
            "teams": [],
        }

    def test_users_register_admin(self):
        """Checks that an admin can create a new user."""
        response = self.client.post(
            "/auth/register",
            cookies={
                "rtauth": get_valid_token(
                    "fastapi-users:auth", user_id=self.user_ids["admin"]
                )
            },
            json={
                "email": "new@user.org",
                "first_name": "new",
                "last_name": "user",
                "password": "password123",
                "roles": [],
                "teams": [],
            },
        )
        assert response.status_code == 201
        rsp_json = response.json()
        assert rsp_json == {
            "id": rsp_json.get("id"),
            "email": "new@user.org",
            "is_active": True,
            "is_verified": False,
            "is_superuser": False,
            "first_name": "new",
            "last_name": "user",
            "last_login": None,
            "last_changed_password": None,
            "roles": [],
            "teams": [],
        }
        self.mock_send_email.assert_called_once()
        assert (
            self.mock_send_email.call_args[0][0]["Subject"]
            == "Your new reporting tool account"
        )

    def test_users_register_normal(self):
        """Checks that a normal user cannot create a new user."""
        response = self.client.post(
            "/auth/register",
            cookies={
                "rtauth": get_valid_token(
                    "fastapi-users:auth", user_id=self.user_ids["normal"]
                )
            },
            json={
                "email": "new@user.org",
                "first_name": "new",
                "last_name": "user",
                "password": "password123",
                "roles": [],
                "teams": [],
            },
        )
        assert response.status_code == 403
        rsp_json = response.json()
        assert rsp_json == {"detail": "You do not have permission for this action"}

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
            },
        )
        assert response.status_code == 401
        rsp_json = response.json()
        assert rsp_json == {"detail": "You are not authenticated"}

    def test_user_register_teams_and_roles(self):
        """Test that user cannot be added to team / roles on creation."""
        response = self.client.post(
            "/auth/register",
            cookies={
                "rtauth": get_valid_token(
                    "fastapi-users:auth", user_id=self.user_ids["admin"]
                )
            },
            json={
                "email": "new@user.org",
                "first_name": "new",
                "last_name": "user",
                "password": "password123",
                "roles": [
                    {
                        "id": "be5f8cac-ac65-4f75-8052-8d1b5d40dffe",
                    }
                ],
                "teams": [
                    {
                        "id": "472d17da-ff8b-4743-823f-3f01ea21a349",
                    }
                ],
            },
        )
        assert response.status_code == 201
        rsp_json = response.json()
        assert rsp_json == {
            "id": rsp_json.get("id"),
            "email": "new@user.org",
            "is_active": True,
            "is_verified": False,
            "is_superuser": False,
            "last_login": None,
            "last_changed_password": None,
            "first_name": "new",
            "last_name": "user",
            "roles": [],
            "teams": [],
        }

    def test_user_update_not_authed(self):
        """Test that users without permission can't update other users."""
        response = self.client.patch(
            f"/users/{self.user_ids['normal']}",
            cookies={"rtauth": get_valid_token("fastapi-users:auth")},
            json={
                "email": "some@updated.email",
            },
        )
        assert response.status_code == 401
        assert response.json() == {"detail": "Unauthorized"}

    def test_user_update_no_perm(self):
        """Test that users without permission can't update other users."""
        for user in ["other", "normal"]:
            response = self.client.patch(
                f"/users/{self.user_ids['normal']}",
                cookies={
                    "rtauth": get_valid_token(
                        "fastapi-users:auth", user_id=self.user_ids[user]
                    )
                },
                json={
                    "email": "some@updated.email",
                },
            )
            assert response.status_code == 403
            assert response.json() == {"detail": "Forbidden"}

    def test_user_update_basic(self):
        """Test that admins and the user themselves can update their info."""
        response = self.client.patch(
            f"/users/{self.user_ids['normal']}",
            cookies={
                "rtauth": get_valid_token(
                    "fastapi-users:auth", user_id=self.user_ids["admin"]
                )
            },
            json={
                "email": "some@updated.email",
            },
        )
        assert response.status_code == 200
        assert response.json() == {
            "email": "some@updated.email",
            "first_name": "Cat",
            "last_name": "Berry",
            "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
            "is_superuser": False,
            "is_active": True,
            "is_verified": False,
            "last_login": None,
            "last_changed_password": None,
            "roles": [],
            "teams": [
                {
                    "id": "472d17da-ff8b-4743-823f-3f01ea21a349",
                    "name": "News Team",
                }
            ],
        }

    def test_user_update_grant_admin(self):
        """Test that the admin can grant other users the admin role."""
        response = self.client.patch(
            f"/users/{self.user_ids['normal']}",
            cookies={
                "rtauth": get_valid_token(
                    "fastapi-users:auth", user_id=self.user_ids["admin"]
                )
            },
            json={
                "roles": [{"id": "be5f8cac-ac65-4f75-8052-8d1b5d40dffe"}],
            },
        )
        assert response.status_code == 200
        assert response.json() == {
            "email": "tester@notrealemail.info",
            "first_name": "Cat",
            "last_name": "Berry",
            "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
            "is_superuser": True,
            "is_active": True,
            "is_verified": False,
            "last_login": None,
            "last_changed_password": None,
            "roles": [
                {
                    "id": "be5f8cac-ac65-4f75-8052-8d1b5d40dffe",
                    "name": "admin",
                    "description": "User is an admin and has administrative privileges",
                }
            ],
            "teams": [
                {
                    "id": "472d17da-ff8b-4743-823f-3f01ea21a349",
                    "name": "News Team",
                }
            ],
        }

    def test_user_cant_give_self_admin(self):
        """Test that normal users can't escalate privileges."""
        response = self.client.patch(
            "/users/me",
            cookies={
                "rtauth": get_valid_token(
                    "fastapi-users:auth", user_id=self.user_ids["normal"]
                )
            },
            json={
                "roles": [{"id": "be5f8cac-ac65-4f75-8052-8d1b5d40dffe"}],
            },
        )
        assert response.json() == {
            "email": "tester@notrealemail.info",
            "first_name": "Cat",
            "last_name": "Berry",
            "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
            "is_superuser": False,
            "is_active": True,
            "is_verified": False,
            "last_login": None,
            "last_changed_password": None,
            "roles": [],
            "teams": [
                {
                    "id": "472d17da-ff8b-4743-823f-3f01ea21a349",
                    "name": "News Team",
                }
            ],
        }
        assert response.status_code == 200

    def test_user_can_verify(self):
        """Test that a user can verify their account through the API."""
        response = self.client.post(
            "/auth/verify",
            json={
                "token": get_valid_token(
                    "fastapi-users:verify",
                    user_id=self.user_ids["normal"],
                    email="tester@notrealemail.info",
                )
            },
        )
        assert response.status_code == 200
        user_response = self.client.get(
            f"/users/{self.user_ids['normal']}",
            cookies={
                "rtauth": get_valid_token(
                    "fastapi-users:auth", user_id=self.user_ids["admin"]
                )
            },
        )
        assert user_response.json() == {
            "email": "tester@notrealemail.info",
            "first_name": "Cat",
            "last_name": "Berry",
            "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
            "last_login": None,
            "last_changed_password": None,
            "is_superuser": False,
            "is_active": True,
            "is_verified": True,
            "roles": [],
            "teams": [
                {
                    "id": "472d17da-ff8b-4743-823f-3f01ea21a349",
                    "name": "News Team",
                }
            ],
        }
        self.mock_send_email.assert_called_once()
        assert (
            self.mock_send_email.call_args[0][0]["Subject"]
            == "Your email has been verified!"
        )

    def test_user_can_reset_password(self):
        """Test that a user can reset their password with a token."""
        response = self.client.post(
            "/auth/reset-password",
            json={
                "token": get_valid_token(
                    "fastapi-users:reset",
                    user_id=self.user_ids["normal"],
                    email="tester@notrealemail.info",
                ),
                "password": "mynewpassword",
            },
        )
        assert response.status_code == 200
        # Check that the password was actually updated
        s = self.Session()
        u = s.query(User).get(self.user_ids["normal"])
        verified, _ = verify_and_update_password("mynewpassword", u.hashed_password)
        s.close()
        assert verified
        # Check that the password appears as changed in the API response
        me = self.client.get(
            "/users/me",
            cookies={
                "rtauth": get_valid_token(
                    "fastapi-users:auth", user_id=self.user_ids["normal"]
                )
            },
        )
        assert me.json()["last_changed_password"] is not None

    def test_request_verify(self):
        """Test that verification request sends an email."""
        response = self.client.post(
            "/auth/request-verify-token", json={"email": "tester@notrealemail.info"}
        )
        assert response.status_code == 202
        self.mock_send_email.assert_called_once()
        assert (
            self.mock_send_email.call_args[0][0]["Subject"]
            == "Please verify your email address"
        )

    def test_forgot_password(self):
        """Test that a user can request a password reset token."""
        response = self.client.post(
            "/auth/forgot-password", json={"email": "tester@notrealemail.info"}
        )
        assert response.status_code == 202
        self.mock_send_email.assert_called_once()
        assert (
            self.mock_send_email.call_args[0][0]["Subject"]
            == "Your password reset token"
        )

    def test_login(self):
        """Test that a user can log in."""
        response = self.client.post(
            "/auth/cookie/login",
            data={
                "username": "admin@notrealemail.info",
                "password": "adminpassword",
            },
        )
        assert response.status_code == 200
        me = self.client.get("/users/me", cookies=response.cookies)
        assert me.json()["last_login"] is not None

    def test_get_my_reset_token(self):
        """Test that a user can get a reset token for themselves."""
        response = self.client.get(
            "/reset-my-password",
            cookies={
                "rtauth": get_valid_token(
                    "fastapi-users:auth", user_id=self.user_ids["admin"]
                )
            },
        )
        assert response.status_code == 200
        assert response.json()["token"] is not None


class TestGraphQL(BaseAppTest):
    """Tests for the GraphQL schema, including permissions directives."""

    def setUp(self, *args, **kwargs):
        super().setUp(*args, **kwargs)
        # Create new session for test case to use
        self.session = self.Session()

        # Fetch some users for testing.
        self.test_users = {
            "admin": User.get_by_email(self.session, "admin@notrealemail.info"),
            "normal": User.get_by_email(self.session, "tester@notrealemail.info"),
            "other": User.get_by_email(self.session, "other@notrealemail.info"),
        }

    def tearDown(self):
        self.session.close()
        super().tearDown()

    def run_graphql_query(self, data, user=None, is_async=False):
        """Run a GraphQL query with the given data as the given user.

        :param data: Dict of a GraphQL query
        :param user: User to run query as
        """
        # TODO: All tests should use async now. Before Python3.8 it was harder
        # to run isolated async unit tests, but now we can do so.
        # https://app.clubhouse.io/stanford-computational-policy-lab/story/335/use-async-graphql-calls-in-all-unit-tests
        method = graphql if is_async else graphql_sync
        return method(
            schema,
            data,
            context_value={
                "dbsession": self.session,
                "current_user": user,
                "request": Mock(),
            },
            debug=True,
        )

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
        self.assertIsNone(result["data"])
        self.assertEqual(len(result["errors"]), 1)

    def test_query_user(self):
        """Test queries for a given user.

        Ensures that this query succeeds for the user querying themself and
        also for an admin querying the user.
        """
        for user_role in ["normal", "admin"]:
            user = self.test_users[user_role]
            success, result = self.run_graphql_query(
                {
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
                },
                user=user,
            )

            # Make sure result is what we expected
            self.assertTrue(success)
            self.assertTrue(
                self.is_valid_uuid(result["data"]["user"]["id"]), "Invalid UUID"
            )
            self.assertEqual(
                result,
                {
                    "data": {
                        "user": {
                            "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                            "firstName": "Cat",
                            "lastName": "Berry",
                            "active": True,
                            "teams": [
                                {
                                    "name": "News Team",
                                    "programs": [
                                        {
                                            "name": "BBC News",
                                            "datasets": [
                                                {
                                                    "name": "Breakfast Hour",
                                                    "records": [
                                                        {
                                                            "id": "742b5971-eeb6-4f7a-8275-6111f2342bb4",
                                                            "publicationDate": "2020-12-21T00:00:00",
                                                        }
                                                    ],
                                                },
                                                {"name": "12PM - 4PM", "records": []},
                                            ],
                                        }
                                    ],
                                }
                            ],
                        },
                    },
                },
            )

    def test_query_user_no_perm(self):
        """Check that a different non-admin user can't query another user."""
        success, result = self.run_graphql_query(
            {
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
            },
            user=self.test_users["other"],
        )

        self.assertTrue(success)
        self.assertResultWasNotAuthed(result)

    def test_query_dataset(self):
        """Test queries for a dataset.

        Tests that the query succeeds for both users on the right team and
        also admin users.
        """
        for user_role in ["normal", "admin"]:
            user = self.test_users[user_role]
            success, result = self.run_graphql_query(
                {
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
                                    count
                                    personType {
                                        personTypeName
                                    }
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
                },
                user=user,
            )

            self.assertTrue(success)
            self.assertEqual(
                result,
                {
                    "data": {
                        "dataset": {
                            "id": "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89",
                            "name": "Breakfast Hour",
                            "description": "breakfast hour programming",
                            "program": {
                                "id": "1e73e788-0808-4ee8-9b25-682b6fa3868b",
                                "name": "BBC News",
                                "tags": [{"name": "News"}],
                            },
                            "records": [
                                {
                                    "id": "742b5971-eeb6-4f7a-8275-6111f2342bb4",
                                    "publicationDate": "2020-12-21T00:00:00",
                                    "entries": [
                                        {
                                            "count": 1,
                                            "personType": {
                                                "personTypeName": "BBC Contributor"
                                            },
                                            "inputter": {
                                                "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                                                "firstName": "Cat",
                                            },
                                            "categoryValue": {
                                                "id": "742b5971-eeb6-4f7a-8275-6111f2342bb4",
                                                "name": "Women",
                                            },
                                        },
                                        {
                                            "count": 1,
                                            "personType": {
                                                "personTypeName": "Non-BBC Contributor"
                                            },
                                            "inputter": {
                                                "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                                                "firstName": "Cat",
                                            },
                                            "categoryValue": {
                                                "id": "742b5971-eeb6-4f7a-8275-6111f2342bb4",
                                                "name": "Women",
                                            },
                                        },
                                        {
                                            "count": 1,
                                            "personType": {
                                                "personTypeName": "BBC Contributor"
                                            },
                                            "inputter": {
                                                "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                                                "firstName": "Cat",
                                            },
                                            "categoryValue": {
                                                "id": "d237a422-5858-459c-bd01-a0abdc077e5b",
                                                "name": "Men",
                                            },
                                        },
                                        {
                                            "count": 1,
                                            "personType": {
                                                "personTypeName": "Non-BBC Contributor"
                                            },
                                            "inputter": {
                                                "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                                                "firstName": "Cat",
                                            },
                                            "categoryValue": {
                                                "id": "d237a422-5858-459c-bd01-a0abdc077e5b",
                                                "name": "Men",
                                            },
                                        },
                                        {
                                            "count": 1,
                                            "personType": {
                                                "personTypeName": "BBC Contributor"
                                            },
                                            "inputter": {
                                                "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                                                "firstName": "Cat",
                                            },
                                            "categoryValue": {
                                                "id": "662557e5-aca8-4cec-ad72-119ad9cda81b",
                                                "name": "Trans women",
                                            },
                                        },
                                        {
                                            "count": 1,
                                            "personType": {
                                                "personTypeName": "Non-BBC Contributor"
                                            },
                                            "inputter": {
                                                "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                                                "firstName": "Cat",
                                            },
                                            "categoryValue": {
                                                "id": "662557e5-aca8-4cec-ad72-119ad9cda81b",
                                                "name": "Trans women",
                                            },
                                        },
                                        {
                                            "count": 1,
                                            "personType": {
                                                "personTypeName": "BBC Contributor"
                                            },
                                            "inputter": {
                                                "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                                                "firstName": "Cat",
                                            },
                                            "categoryValue": {
                                                "id": "1525cce8-7db3-4e73-b5b0-d2bd14777534",
                                                "name": "Trans men",
                                            },
                                        },
                                        {
                                            "count": 1,
                                            "personType": {
                                                "personTypeName": "Non-BBC Contributor"
                                            },
                                            "inputter": {
                                                "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                                                "firstName": "Cat",
                                            },
                                            "categoryValue": {
                                                "id": "1525cce8-7db3-4e73-b5b0-d2bd14777534",
                                                "name": "Trans men",
                                            },
                                        },
                                        {
                                            "count": 1,
                                            "personType": {
                                                "personTypeName": "BBC Contributor"
                                            },
                                            "inputter": {
                                                "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                                                "firstName": "Cat",
                                            },
                                            "categoryValue": {
                                                "id": "a72ced2b-b1a6-4d3d-b003-e35e980960df",
                                                "name": "Gender non-conforming",
                                            },
                                        },
                                        {
                                            "count": 1,
                                            "personType": {
                                                "personTypeName": "Non-BBC Contributor"
                                            },
                                            "inputter": {
                                                "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                                                "firstName": "Cat",
                                            },
                                            "categoryValue": {
                                                "id": "a72ced2b-b1a6-4d3d-b003-e35e980960df",
                                                "name": "Gender non-conforming",
                                            },
                                        },
                                        {
                                            "count": 1,
                                            "personType": {
                                                "personTypeName": "BBC Contributor"
                                            },
                                            "inputter": {
                                                "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                                                "firstName": "Cat",
                                            },
                                            "categoryValue": {
                                                "id": "6cae6d26-97e1-4e9c-b1ad-954b4110e83b",
                                                "name": "Non-binary",
                                            },
                                        },
                                        {
                                            "count": 1,
                                            "personType": {
                                                "personTypeName": "Non-BBC Contributor"
                                            },
                                            "inputter": {
                                                "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                                                "firstName": "Cat",
                                            },
                                            "categoryValue": {
                                                "id": "6cae6d26-97e1-4e9c-b1ad-954b4110e83b",
                                                "name": "Non-binary",
                                            },
                                        },
                                        {
                                            "count": 1,
                                            "personType": {
                                                "personTypeName": "BBC Contributor"
                                            },
                                            "inputter": {
                                                "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                                                "firstName": "Cat",
                                            },
                                            "categoryValue": {
                                                "id": "c36958cb-cc62-479e-ab61-eb03896a981c",
                                                "name": "Disabled",
                                            },
                                        },
                                        {
                                            "count": 1,
                                            "personType": {
                                                "personTypeName": "Non-BBC Contributor"
                                            },
                                            "inputter": {
                                                "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                                                "firstName": "Cat",
                                            },
                                            "categoryValue": {
                                                "id": "c36958cb-cc62-479e-ab61-eb03896a981c",
                                                "name": "Disabled",
                                            },
                                        },
                                        {
                                            "count": 1,
                                            "personType": {
                                                "personTypeName": "BBC Contributor"
                                            },
                                            "inputter": {
                                                "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                                                "firstName": "Cat",
                                            },
                                            "categoryValue": {
                                                "id": "55119215-71e9-43ca-b2c1-7e7fb8cec2fd",
                                                "name": "Non-disabled",
                                            },
                                        },
                                        {
                                            "count": 1,
                                            "personType": {
                                                "personTypeName": "Non-BBC Contributor"
                                            },
                                            "inputter": {
                                                "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                                                "firstName": "Cat",
                                            },
                                            "categoryValue": {
                                                "id": "55119215-71e9-43ca-b2c1-7e7fb8cec2fd",
                                                "name": "Non-disabled",
                                            },
                                        },
                                    ],
                                }
                            ],
                            "tags": [
                                {
                                    "id": "4a2142c0-5416-431d-b62f-0dbfe7574688",
                                    "name": "News",
                                }
                            ],
                        }
                    }
                },
            )

    def test_query_dataset_no_perm(self):
        """Test that a user can't query a dataset if they're not on the team."""
        success, result = self.run_graphql_query(
            {
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
            },
            user=self.test_users["other"],
        )

        self.assertTrue(success)
        self.assertResultWasNotAuthed(result)

    def test_create_dataset(self):
        success, result = self.run_graphql_query(
            {
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
                        "tags": [
                            {
                                "name": "Europe",
                                "description": "i am europe",
                                "tagType": "location",
                            }
                        ],
                    }
                },
            },
            user=self.test_users["admin"],
        )

        self.assertTrue(success)
        self.assertTrue(
            self.is_valid_uuid(result["data"]["createDataset"]["id"]), "Invalid UUID"
        )
        self.assertEqual(
            result,
            {
                "data": {
                    "createDataset": {
                        "id": result["data"]["createDataset"]["id"],
                        "name": "Happy Hour",
                        "description": "A very happy time",
                        "program": {"name": "BBC News"},
                        "tags": [{"name": "Europe"}],
                    },
                },
            },
        )

    def test_create_dataset_no_perm(self):
        """Test that dataset creation fails for normal (non-admin) users."""
        for user_role in ["other", "normal"]:
            user = self.test_users[user_role]
            success, result = self.run_graphql_query(
                {
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
                            "tags": [
                                {
                                    "name": "Europe",
                                    "description": "i am europe",
                                    "tagType": "location",
                                }
                            ],
                        }
                    },
                },
                user=user,
            )

            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)

    def test_update_dataset(self):
        success, result = self.run_graphql_query(
            {
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
                        "tags": [
                            {
                                "name": "Asia",
                                "description": "i am asia",
                                "tagType": "location",
                            }
                        ],
                    }
                },
            },
            user=self.test_users["admin"],
        )

        self.assertTrue(success)
        self.assertTrue(
            self.is_valid_uuid(result["data"]["updateDataset"]["id"]), "Invalid UUID"
        )
        self.assertEqual(
            result,
            {
                "data": {
                    "updateDataset": {
                        "id": "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89",
                        "name": "Tea Time",
                        "description": "Tea time programming",
                        "program": {"name": "BBC News"},
                        "tags": [{"name": "News"}, {"name": "Asia"}],
                    },
                },
            },
        )

    def test_update_dataset_no_perm(self):
        """Test that dataset updates fail for normal (non-admin) users."""
        for user_role in ["other", "normal"]:
            user = self.test_users[user_role]
            success, result = self.run_graphql_query(
                {
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
                            "tags": [
                                {
                                    "name": "Asia",
                                    "description": "i am asia",
                                    "tagType": "location",
                                }
                            ],
                        }
                    },
                },
                user=user,
            )

            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)

    def test_delete_dataset(self):
        # Confirm Dataset exists, then that it does not.
        dataset_id = "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89"
        existing_dataset = Dataset.get_not_deleted(self.session, dataset_id)
        self.assertNotEqual(existing_dataset, None)
        success, result = self.run_graphql_query(
            {
                "operationName": "DeleteDataset",
                "query": """
                mutation DeleteDataset($id: ID!) {
                   deleteDataset(id: $id)
                }
            """,
                "variables": {"id": dataset_id},
            },
            user=self.test_users["admin"],
        )

        self.assertTrue(success)
        # Query for all associated Records
        associated_records = self.session.query(Record).filter(
            Record.dataset_id == dataset_id, Record.deleted == None
        )
        # Compile list of associated Record IDs
        associated_record_ids = [record.id for record in associated_records]
        # Query for non-deleted Entries associated with each Record id
        existing_entries = self.session.query(Entry).filter(
            Entry.record_id.in_(associated_record_ids), Entry.deleted == None
        )
        # Querying for non-deleted associated Records
        existing_records = associated_records.filter(Record.deleted == None)
        # Count of non-deleted records, and entries should be zero
        self.assertEqual(existing_entries.count(), 0)
        self.assertEqual(existing_records.count(), 0)
        self.assertTrue(self.is_valid_uuid(dataset_id), "Invalid UUID")

        self.assertEqual(
            result,
            {
                "data": {"deleteDataset": dataset_id},
            },
        )

    def test_delete_dataset_no_perm(self):
        """Test that dataset deletes fail for normal (non-admin) users."""
        for user_role in ["other", "normal"]:
            user = self.test_users[user_role]
            # Confirm Dataset exists, then that it does not.
            dataset_id = "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89"
            existing_dataset = Dataset.get_not_deleted(self.session, dataset_id)
            self.assertNotEqual(existing_dataset, None)
            success, result = self.run_graphql_query(
                {
                    "operationName": "DeleteDataset",
                    "query": """
                    mutation DeleteDataset($id: ID!) {
                       deleteDataset(id: $id)
                    }
                """,
                    "variables": {"id": dataset_id},
                },
                user=user,
            )

            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)
            # Verify nothing was deleted
            existing_dataset = Dataset.get_not_deleted(self.session, dataset_id)
            self.assertNotEqual(existing_dataset, None)

    def test_query_record(self):
        """Test that dataset records can be queried.

        Users on the right team and admins should be able to query records.
        """
        for user_role in ["admin", "normal"]:
            user = self.test_users[user_role]
            success, result = self.run_graphql_query(
                {
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
                                personType {
                                    personTypeName
                                }
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
                },
                user=user,
            )

            self.assertTrue(success)
            self.assertEqual(
                result,
                {
                    "data": {
                        "record": {
                            "id": "742b5971-eeb6-4f7a-8275-6111f2342bb4",
                            "publicationDate": "2020-12-21T00:00:00",
                            "dataset": {"id": "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89"},
                            "entries": [
                                {
                                    "personType": {"personTypeName": "BBC Contributor"},
                                    "categoryValue": {
                                        "id": "742b5971-eeb6-4f7a-8275-6111f2342bb4",
                                        "name": "Women",
                                    },
                                },
                                {
                                    "personType": {
                                        "personTypeName": "Non-BBC Contributor"
                                    },
                                    "categoryValue": {
                                        "id": "742b5971-eeb6-4f7a-8275-6111f2342bb4",
                                        "name": "Women",
                                    },
                                },
                                {
                                    "personType": {"personTypeName": "BBC Contributor"},
                                    "categoryValue": {
                                        "id": "d237a422-5858-459c-bd01-a0abdc077e5b",
                                        "name": "Men",
                                    },
                                },
                                {
                                    "personType": {
                                        "personTypeName": "Non-BBC Contributor"
                                    },
                                    "categoryValue": {
                                        "id": "d237a422-5858-459c-bd01-a0abdc077e5b",
                                        "name": "Men",
                                    },
                                },
                                {
                                    "personType": {"personTypeName": "BBC Contributor"},
                                    "categoryValue": {
                                        "id": "662557e5-aca8-4cec-ad72-119ad9cda81b",
                                        "name": "Trans women",
                                    },
                                },
                                {
                                    "personType": {
                                        "personTypeName": "Non-BBC Contributor"
                                    },
                                    "categoryValue": {
                                        "id": "662557e5-aca8-4cec-ad72-119ad9cda81b",
                                        "name": "Trans women",
                                    },
                                },
                                {
                                    "personType": {"personTypeName": "BBC Contributor"},
                                    "categoryValue": {
                                        "id": "1525cce8-7db3-4e73-b5b0-d2bd14777534",
                                        "name": "Trans men",
                                    },
                                },
                                {
                                    "personType": {
                                        "personTypeName": "Non-BBC Contributor"
                                    },
                                    "categoryValue": {
                                        "id": "1525cce8-7db3-4e73-b5b0-d2bd14777534",
                                        "name": "Trans men",
                                    },
                                },
                                {
                                    "personType": {"personTypeName": "BBC Contributor"},
                                    "categoryValue": {
                                        "id": "a72ced2b-b1a6-4d3d-b003-e35e980960df",
                                        "name": "Gender non-conforming",
                                    },
                                },
                                {
                                    "personType": {
                                        "personTypeName": "Non-BBC Contributor"
                                    },
                                    "categoryValue": {
                                        "id": "a72ced2b-b1a6-4d3d-b003-e35e980960df",
                                        "name": "Gender non-conforming",
                                    },
                                },
                                {
                                    "personType": {"personTypeName": "BBC Contributor"},
                                    "categoryValue": {
                                        "id": "6cae6d26-97e1-4e9c-b1ad-954b4110e83b",
                                        "name": "Non-binary",
                                    },
                                },
                                {
                                    "personType": {
                                        "personTypeName": "Non-BBC Contributor"
                                    },
                                    "categoryValue": {
                                        "id": "6cae6d26-97e1-4e9c-b1ad-954b4110e83b",
                                        "name": "Non-binary",
                                    },
                                },
                                {
                                    "personType": {"personTypeName": "BBC Contributor"},
                                    "categoryValue": {
                                        "id": "c36958cb-cc62-479e-ab61-eb03896a981c",
                                        "name": "Disabled",
                                    },
                                },
                                {
                                    "personType": {
                                        "personTypeName": "Non-BBC Contributor"
                                    },
                                    "categoryValue": {
                                        "id": "c36958cb-cc62-479e-ab61-eb03896a981c",
                                        "name": "Disabled",
                                    },
                                },
                                {
                                    "personType": {"personTypeName": "BBC Contributor"},
                                    "categoryValue": {
                                        "id": "55119215-71e9-43ca-b2c1-7e7fb8cec2fd",
                                        "name": "Non-disabled",
                                    },
                                },
                                {
                                    "personType": {
                                        "personTypeName": "Non-BBC Contributor"
                                    },
                                    "categoryValue": {
                                        "id": "55119215-71e9-43ca-b2c1-7e7fb8cec2fd",
                                        "name": "Non-disabled",
                                    },
                                },
                            ],
                        }
                    }
                },
            )

    def test_query_record_no_perm(self):
        """Test that dataset records can't be queried by users on the wrong team."""
        success, result = self.run_graphql_query(
            {
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
            },
            user=self.test_users["other"],
        )

        self.assertTrue(success)
        self.assertResultWasNotAuthed(result)

    def test_create_record(self):
        """Test that admins and users on the right team can create records."""
        for user_role in ["admin", "normal"]:
            self.setUp()
            user = self.test_users[user_role]
            success, result = self.run_graphql_query(
                {
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
                            "publicationDate": "2020-12-22T00:00:00.000Z",
                            "entries": [
                                {
                                    "count": 7,
                                    "categoryValueId": "662557e5-aca8-4cec-ad72-119ad9cda81b",
                                }
                            ],
                        }
                    },
                },
                user=user,
            )

            self.assertTrue(success)
            self.assertTrue(
                self.is_valid_uuid(result["data"]["createRecord"]["id"]), "Invalid UUID"
            )
            self.assertEqual(
                result,
                {
                    "data": {
                        "createRecord": {
                            "id": result["data"]["createRecord"]["id"],
                            "publicationDate": "2020-12-22T00:00:00",
                            "dataset": {
                                "id": "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89",
                                "name": "Breakfast Hour",
                            },
                            "entries": [
                                {
                                    "count": 7,
                                    "categoryValue": {
                                        "id": "662557e5-aca8-4cec-ad72-119ad9cda81b",
                                        "name": "Trans women",
                                    },
                                    "inputter": {"id": str(user.id)},
                                }
                            ],
                        },
                    },
                },
            )

            self.tearDown()

    def test_create_record_no_perm(self):
        """Test that users of other teams can't create records"""
        user = self.test_users["other"]
        success, result = self.run_graphql_query(
            {
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
                        "publicationDate": "2020-12-22T00:00:00.000Z",
                        "entries": [
                            {
                                "count": 7,
                                "categoryValueId": "662557e5-aca8-4cec-ad72-119ad9cda81b",
                                "inputterId": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                            }
                        ],
                    }
                },
            },
            user=user,
        )

        self.assertTrue(success)
        self.assertResultWasNotAuthed(result)

    def test_update_record(self):
        """Test that users on a team / admins can update records."""
        for user_role in ["admin", "normal"]:
            user = self.test_users[user_role]
            success, result = self.run_graphql_query(
                {
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
                                personType {
                                    personTypeName
                                }
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
                            "publicationDate": "2020-12-25T00:00:00.000",
                            "datasetId": "96336531-9245-405f-bd28-5b4b12ea3798",
                            "entries": [
                                {
                                    "id": "64677dc1-a1cd-4cd3-965d-6565832d307a",
                                    "categoryValueId": "6cae6d26-97e1-4e9c-b1ad-954b4110e83b",
                                    "count": 0,
                                }
                            ],
                        }
                    },
                },
                user=user,
            )

            self.assertTrue(success)
            self.assertTrue(
                self.is_valid_uuid(result["data"]["updateRecord"]["id"]), "Invalid UUID"
            )

            assert result == {
                "data": {
                    "updateRecord": {
                        "id": "742b5971-eeb6-4f7a-8275-6111f2342bb4",
                        "publicationDate": "2020-12-25T00:00:00",
                        "dataset": {
                            "id": "96336531-9245-405f-bd28-5b4b12ea3798",
                            "name": "12PM - 4PM",
                        },
                        "entries": [
                            {
                                "count": 1,
                                "personType": {"personTypeName": "BBC Contributor"},
                                "categoryValue": {
                                    "id": "742b5971-eeb6-4f7a-8275-6111f2342bb4",
                                    "name": "Women",
                                    "category": {
                                        "id": "51349e29-290e-4398-a401-5bf7d04af75e",
                                        "name": "Gender",
                                    },
                                },
                            },
                            {
                                "count": 1,
                                "personType": {"personTypeName": "Non-BBC Contributor"},
                                "categoryValue": {
                                    "id": "742b5971-eeb6-4f7a-8275-6111f2342bb4",
                                    "name": "Women",
                                    "category": {
                                        "id": "51349e29-290e-4398-a401-5bf7d04af75e",
                                        "name": "Gender",
                                    },
                                },
                            },
                            {
                                "count": 1,
                                "personType": {"personTypeName": "BBC Contributor"},
                                "categoryValue": {
                                    "id": "d237a422-5858-459c-bd01-a0abdc077e5b",
                                    "name": "Men",
                                    "category": {
                                        "id": "51349e29-290e-4398-a401-5bf7d04af75e",
                                        "name": "Gender",
                                    },
                                },
                            },
                            {
                                "count": 1,
                                "personType": {"personTypeName": "Non-BBC Contributor"},
                                "categoryValue": {
                                    "id": "d237a422-5858-459c-bd01-a0abdc077e5b",
                                    "name": "Men",
                                    "category": {
                                        "id": "51349e29-290e-4398-a401-5bf7d04af75e",
                                        "name": "Gender",
                                    },
                                },
                            },
                            {
                                "count": 1,
                                "personType": {"personTypeName": "BBC Contributor"},
                                "categoryValue": {
                                    "id": "662557e5-aca8-4cec-ad72-119ad9cda81b",
                                    "name": "Trans women",
                                    "category": {
                                        "id": "51349e29-290e-4398-a401-5bf7d04af75e",
                                        "name": "Gender",
                                    },
                                },
                            },
                            {
                                "count": 1,
                                "personType": {"personTypeName": "Non-BBC Contributor"},
                                "categoryValue": {
                                    "id": "662557e5-aca8-4cec-ad72-119ad9cda81b",
                                    "name": "Trans women",
                                    "category": {
                                        "id": "51349e29-290e-4398-a401-5bf7d04af75e",
                                        "name": "Gender",
                                    },
                                },
                            },
                            {
                                "count": 1,
                                "personType": {"personTypeName": "BBC Contributor"},
                                "categoryValue": {
                                    "id": "1525cce8-7db3-4e73-b5b0-d2bd14777534",
                                    "name": "Trans men",
                                    "category": {
                                        "id": "51349e29-290e-4398-a401-5bf7d04af75e",
                                        "name": "Gender",
                                    },
                                },
                            },
                            {
                                "count": 1,
                                "personType": {"personTypeName": "Non-BBC Contributor"},
                                "categoryValue": {
                                    "id": "1525cce8-7db3-4e73-b5b0-d2bd14777534",
                                    "name": "Trans men",
                                    "category": {
                                        "id": "51349e29-290e-4398-a401-5bf7d04af75e",
                                        "name": "Gender",
                                    },
                                },
                            },
                            {
                                "count": 1,
                                "personType": {"personTypeName": "BBC Contributor"},
                                "categoryValue": {
                                    "id": "a72ced2b-b1a6-4d3d-b003-e35e980960df",
                                    "name": "Gender non-conforming",
                                    "category": {
                                        "id": "51349e29-290e-4398-a401-5bf7d04af75e",
                                        "name": "Gender",
                                    },
                                },
                            },
                            {
                                "count": 1,
                                "personType": {"personTypeName": "Non-BBC Contributor"},
                                "categoryValue": {
                                    "id": "a72ced2b-b1a6-4d3d-b003-e35e980960df",
                                    "name": "Gender non-conforming",
                                    "category": {
                                        "id": "51349e29-290e-4398-a401-5bf7d04af75e",
                                        "name": "Gender",
                                    },
                                },
                            },
                            {
                                "count": 0,
                                "personType": {"personTypeName": "BBC Contributor"},
                                "categoryValue": {
                                    "id": "6cae6d26-97e1-4e9c-b1ad-954b4110e83b",
                                    "name": "Non-binary",
                                    "category": {
                                        "id": "51349e29-290e-4398-a401-5bf7d04af75e",
                                        "name": "Gender",
                                    },
                                },
                            },
                            {
                                "count": 1,
                                "personType": {"personTypeName": "Non-BBC Contributor"},
                                "categoryValue": {
                                    "id": "6cae6d26-97e1-4e9c-b1ad-954b4110e83b",
                                    "name": "Non-binary",
                                    "category": {
                                        "id": "51349e29-290e-4398-a401-5bf7d04af75e",
                                        "name": "Gender",
                                    },
                                },
                            },
                            {
                                "count": 1,
                                "personType": {"personTypeName": "BBC Contributor"},
                                "categoryValue": {
                                    "id": "c36958cb-cc62-479e-ab61-eb03896a981c",
                                    "name": "Disabled",
                                    "category": {
                                        "id": "55119215-71e9-43ca-b2c1-7e7fb8cec2fd",
                                        "name": "Disability",
                                    },
                                },
                            },
                            {
                                "count": 1,
                                "personType": {"personTypeName": "Non-BBC Contributor"},
                                "categoryValue": {
                                    "id": "c36958cb-cc62-479e-ab61-eb03896a981c",
                                    "name": "Disabled",
                                    "category": {
                                        "id": "55119215-71e9-43ca-b2c1-7e7fb8cec2fd",
                                        "name": "Disability",
                                    },
                                },
                            },
                            {
                                "count": 1,
                                "personType": {"personTypeName": "BBC Contributor"},
                                "categoryValue": {
                                    "id": "55119215-71e9-43ca-b2c1-7e7fb8cec2fd",
                                    "name": "Non-disabled",
                                    "category": {
                                        "id": "55119215-71e9-43ca-b2c1-7e7fb8cec2fd",
                                        "name": "Disability",
                                    },
                                },
                            },
                            {
                                "count": 1,
                                "personType": {"personTypeName": "Non-BBC Contributor"},
                                "categoryValue": {
                                    "id": "55119215-71e9-43ca-b2c1-7e7fb8cec2fd",
                                    "name": "Non-disabled",
                                    "category": {
                                        "id": "55119215-71e9-43ca-b2c1-7e7fb8cec2fd",
                                        "name": "Disability",
                                    },
                                },
                            },
                        ],
                    }
                }
            }

    def test_update_record_no_perm(self):
        """Test that users on other teams can't update records."""
        user = self.test_users["other"]
        success, result = self.run_graphql_query(
            {
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
                        "publicationDate": "2020-12-25T00:00:00.000Z",
                        "datasetId": "96336531-9245-405f-bd28-5b4b12ea3798",
                        "entries": [
                            {
                                "id": "64677dc1-a1cd-4cd3-965d-6565832d307a",
                                "categoryValueId": "6cae6d26-97e1-4e9c-b1ad-954b4110e83b",
                                "inputterId": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                                "count": 0,
                            }
                        ],
                    }
                },
            },
            user=user,
        )

        self.assertTrue(success)
        self.assertResultWasNotAuthed(result)

    def test_delete_record(self):
        """Test that users on a team and admins can delete records."""
        for user_role in ["admin", "normal"]:
            self.setUp()
            user = self.test_users[user_role]
            # Confirm Record exists, then that it does not.
            record_id = "742b5971-eeb6-4f7a-8275-6111f2342bb4"
            existing_record = Record.get_not_deleted(self.session, record_id)
            # Count of non-deleted records should not be None
            self.assertNotEqual(existing_record, None)
            success, result = self.run_graphql_query(
                {
                    "operationName": "DeleteRecord",
                    "query": """
                    mutation DeleteRecord($id: ID!) {
                       deleteRecord(id: $id)
                    }
                """,
                    "variables": {"id": record_id},
                },
                user=user,
            )

            self.assertTrue(success)
            # Query for Records that were not deleted
            record = Record.get_not_deleted(self.session, record_id)
            # Record should be None
            self.assertEqual(record, None)
            # Query for all associated Entries
            associated_entries = self.session.query(Entry).filter(
                Entry.record_id == record_id, Entry.deleted == None
            )
            # Entries count should be zero
            self.assertEqual(associated_entries.count(), 0)
            self.assertTrue(self.is_valid_uuid(record_id), "Invalid UUID")
            self.assertEqual(
                result,
                {
                    "data": {"deleteRecord": record_id},
                },
            )
            self.tearDown()

    def test_delete_record_no_perm(self):
        """Test that users on a different team can't delete a record."""
        user = self.test_users["other"]
        # Confirm Record exists, then that it does not.
        record_id = "742b5971-eeb6-4f7a-8275-6111f2342bb4"
        existing_record = Record.get_not_deleted(self.session, record_id)
        # Count of non-deleted records should not be None
        self.assertNotEqual(existing_record, None)
        success, result = self.run_graphql_query(
            {
                "operationName": "DeleteRecord",
                "query": """
                mutation DeleteRecord($id: ID!) {
                    deleteRecord(id: $id)
                }
            """,
                "variables": {"id": record_id},
            },
            user=user,
        )

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
            success, result = self.run_graphql_query(
                {
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
                },
                user=user,
            )

            self.assertTrue(success)
            self.assertEqual(
                result,
                {
                    "data": {
                        "category": {
                            "id": "51349e29-290e-4398-a401-5bf7d04af75e",
                            "name": "Gender",
                        },
                    },
                },
            )

    def test_create_category(self):
        """Test that the admin can create a category."""
        success, result = self.run_graphql_query(
            {
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
                    "input": {"name": "Ethnicity", "description": "Ethnicity is..."}
                },
            },
            user=self.test_users["admin"],
        )
        self.assertTrue(success)
        self.assertTrue(
            self.is_valid_uuid(result["data"]["createCategory"]["id"]), "Invalid UUID"
        )
        self.assertEqual(
            result,
            {
                "data": {
                    "createCategory": {
                        "id": result["data"]["createCategory"]["id"],
                        "name": "Ethnicity",
                        "description": "Ethnicity is...",
                    },
                },
            },
        )

    def test_create_category_no_perm(self):
        """Test that non-admins can not create a category."""
        for user_role in ["normal", "other"]:
            user = self.test_users[user_role]
            success, result = self.run_graphql_query(
                {
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
                        "input": {"name": "Ethnicity", "description": "Ethnicity is..."}
                    },
                },
                user=user,
            )
            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)

    def test_update_category(self):
        """Test that the admin can update categories."""
        success, result = self.run_graphql_query(
            {
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
                        "description": "Disability is ...",
                    }
                },
            },
            self.test_users["admin"],
        )
        self.assertTrue(success)
        self.assertTrue(
            self.is_valid_uuid(result["data"]["updateCategory"]["id"]), "Invalid UUID"
        )
        self.assertEqual(
            result,
            {
                "data": {
                    "updateCategory": {
                        "id": "51349e29-290e-4398-a401-5bf7d04af75e",
                        "name": "Disability",
                        "description": "Disability is ...",
                    },
                },
            },
        )

    def test_update_category_no_perm(self):
        """Test that users other than admin can not update categories."""
        for user_role in ["normal", "other"]:
            user = self.test_users[user_role]
            success, result = self.run_graphql_query(
                {
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
                            "description": "Disability is ...",
                        }
                    },
                },
                user=user,
            )
            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)

    def test_delete_category(self):
        """Test that admin can delete a category."""
        user = self.test_users["admin"]
        category_id = "51349e29-290e-4398-a401-5bf7d04af75e"
        # Confirm Category exists, then that it does not.
        existing_category = Category.get_not_deleted(self.session, category_id)
        # Existing Category should not be None
        self.assertNotEqual(existing_category, None)
        success, result = self.run_graphql_query(
            {
                "operationName": "DeleteCategory",
                "query": """
                mutation DeleteCategory($id: ID!) {
                    deleteCategory(id: $id)
                }
            """,
                "variables": {
                    "id": category_id,
                },
            },
            user=user,
        )
        self.assertTrue(success)
        category = Category.get_not_deleted(self.session, category_id)
        self.assertEqual(category, None)

        # Check that categoryValue was also soft deleted
        category_value = (
            self.session.query(CategoryValue)
            .filter(
                CategoryValue.category_id == category_id, CategoryValue.deleted == None
            )
            .scalar()
        )
        self.assertEqual(category_value, None)

        self.assertTrue(self.is_valid_uuid(category_id), "Invalid UUID")
        self.assertEqual(
            result,
            {
                "data": {"deleteCategory": category_id},
            },
        )

    def test_delete_category_no_perm(self):
        """Test that non-admins can not delete a category."""
        for user_role in ["normal", "other"]:
            user = self.test_users[user_role]
            category_id = "51349e29-290e-4398-a401-5bf7d04af75e"
            # Confirm Category exists, then that it does not.
            existing_category = Category.get_not_deleted(self.session, category_id)
            # Existing Category should not be None
            self.assertNotEqual(existing_category, None)
            success, result = self.run_graphql_query(
                {
                    "operationName": "DeleteCategory",
                    "query": """
                    mutation DeleteCategory($id: ID!) {
                        deleteCategory(id: $id)
                    }
                """,
                    "variables": {
                        "id": category_id,
                    },
                },
                user=user,
            )
            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)
            category = Category.get_not_deleted(self.session, category_id)
            self.assertNotEqual(category, None)

    def test_query_category_value(self):
        """Test that anyone can query category values"""
        for user_role in ["normal", "other"]:
            user = self.test_users[user_role]
            success, result = self.run_graphql_query(
                {
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
                },
                user=user,
            )

            self.assertTrue(success)
            self.assertEqual(
                result,
                {
                    "data": {
                        "categoryValue": {
                            "id": "742b5971-eeb6-4f7a-8275-6111f2342bb4",
                            "name": "Women",
                        },
                    },
                },
            )

    def test_create_category_value(self):
        """Test that only admins can create category values."""
        user = self.test_users["admin"]
        success, result = self.run_graphql_query(
            {
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
                        "categoryId": "51349e29-290e-4398-a401-5bf7d04af75e",
                    }
                },
            },
            user=user,
        )
        self.assertTrue(success)
        self.assertTrue(
            self.is_valid_uuid(result["data"]["createCategoryValue"]["id"]),
            "Invalid UUID",
        )
        self.assertEqual(
            result,
            {
                "data": {
                    "createCategoryValue": {
                        "id": result["data"]["createCategoryValue"]["id"],
                        "name": "Questioning",
                        "category": {
                            "id": "51349e29-290e-4398-a401-5bf7d04af75e",
                            "name": "Gender",
                        },
                    },
                },
            },
        )

    def test_create_category_value_no_perm(self):
        """Test that non-admins can not create category values."""
        for user in ["normal", "other"]:
            user = self.test_users[user]
            success, result = self.run_graphql_query(
                {
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
                            "categoryId": "51349e29-290e-4398-a401-5bf7d04af75e",
                        }
                    },
                },
                user=user,
            )
            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)

    def test_update_category_value(self):
        """Only admins can update category values"""
        user = self.test_users["admin"]
        success, result = self.run_graphql_query(
            {
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
                        "name": "transgender woman",
                    }
                },
            },
            user=user,
        )
        self.assertTrue(success)
        self.assertTrue(
            self.is_valid_uuid(result["data"]["updateCategoryValue"]["id"]),
            "Invalid UUID",
        )
        self.assertEqual(
            result,
            {
                "data": {
                    "updateCategoryValue": {
                        "id": "662557e5-aca8-4cec-ad72-119ad9cda81b",
                        "name": "Transgender woman",
                        "category": {
                            "id": "51349e29-290e-4398-a401-5bf7d04af75e",
                            "name": "Gender",
                        },
                    },
                },
            },
        )

    def test_update_category_value_no_perm(self):
        """Only admins can update category values"""
        for user in ["normal", "other"]:
            user = self.test_users[user]
            success, result = self.run_graphql_query(
                {
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
                            "name": "transgender woman",
                        }
                    },
                },
                user=user,
            )
            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)

    def test_delete_category_value(self):
        """Only admins can delete category values."""
        user = self.test_users["admin"]
        category_value_id = "0034d015-0652-497d-ab4a-d42b0bdf08cb"
        # Confirm Value exists, then that it does not.
        existing_category_value = CategoryValue.get_not_deleted(
            self.session, category_value_id
        )
        # Existing CategoryValue should not be None
        self.assertNotEqual(existing_category_value, None)
        success, result = self.run_graphql_query(
            {
                "operationName": "DeleteCategoryValue",
                "query": """
                mutation DeleteCategoryValue($id: ID!) {
                    deleteCategoryValue(id: $id)
                }
            """,
                "variables": {
                    "id": category_value_id,
                },
            },
            user=user,
        )
        self.assertTrue(success)
        category_value = CategoryValue.get_not_deleted(self.session, category_value_id)
        self.assertEqual(category_value, None)
        self.assertTrue(self.is_valid_uuid(category_value_id), "Invalid UUID")
        self.assertEqual(
            result,
            {
                "data": {"deleteCategoryValue": category_value_id},
            },
        )

    def test_delete_category_value_no_perm(self):
        """Only admins can delete category values."""
        for user in ["normal", "other"]:
            user = self.test_users[user]
            category_value_id = "0034d015-0652-497d-ab4a-d42b0bdf08cb"
            # Confirm Value exists, then that it does not.
            existing_category_value = CategoryValue.get_not_deleted(
                self.session, category_value_id
            )
            # CExisting CategoryValue should not be None
            self.assertNotEqual(existing_category_value, None)
            success, result = self.run_graphql_query(
                {
                    "operationName": "DeleteCategoryValue",
                    "query": """
                    mutation DeleteCategoryValue($id: ID!) {
                        deleteCategoryValue(id: $id)
                    }
                """,
                    "variables": {
                        "id": category_value_id,
                    },
                },
                user=user,
            )
            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)
            category_value = CategoryValue.get_not_deleted(
                self.session, category_value_id
            )
            self.assertNotEqual(category_value, None)

    def test_query_team(self):
        """Test that anyone can query teams"""
        for user_role in ["normal"]:
            user = self.test_users[user_role]
            success, result = self.run_graphql_query(
                {
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
                },
                user=user,
            )

            self.assertTrue(success)
            self.assertEqual(
                result,
                {
                    "data": {
                        "team": {
                            "id": "472d17da-ff8b-4743-823f-3f01ea21a349",
                            "name": "News Team",
                        },
                    },
                },
            )

    def test_create_team(self):
        """Test that the admin can create a team."""
        success, result = self.run_graphql_query(
            {
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
                        "organizationId": "15d89a19-b78d-4ee8-b321-043f26bdd48a",
                    }
                },
            },
            user=self.test_users["admin"],
        )
        self.assertTrue(success)
        print(f"{result}, resultoooo")
        self.assertTrue(
            self.is_valid_uuid(result["data"]["createTeam"]["id"]), "Invalid UUID"
        )
        self.assertEqual(
            result,
            {
                "data": {
                    "createTeam": {
                        "id": result["data"]["createTeam"]["id"],
                        "name": "The Best Team!",
                        "users": [
                            {
                                "id": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
                                "firstName": "Cat",
                            }
                        ],
                        "programs": [
                            {
                                "id": "1e73e788-0808-4ee8-9b25-682b6fa3868b",
                                "name": "BBC News",
                            }
                        ],
                        "organization": {"name": "BBC"},
                    },
                },
            },
        )

    def test_create_teams_no_perm(self):
        """Test that non-admins can not create a team."""
        for user_role in ["normal", "other"]:
            user = self.test_users[user_role]
            success, result = self.run_graphql_query(
                {
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
                            "organizationId": "15d89a19-b78d-4ee8-b321-043f26bdd48a",
                        }
                    },
                },
                user=user,
            )
            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)

    def test_update_team(self):
        """Only admins can update teams"""
        user = self.test_users["admin"]
        success, result = self.run_graphql_query(
            {
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
                        "name": "New Name",
                    }
                },
            },
            user=user,
        )
        self.assertTrue(success)
        self.assertEqual(
            result,
            {
                "data": {
                    "updateTeam": {
                        "id": "472d17da-ff8b-4743-823f-3f01ea21a349",
                        "name": "New Name",
                    },
                },
            },
        )

    def test_update_team_no_perm(self):
        """Only admins can update teams"""
        for user in ["normal", "other"]:
            user = self.test_users[user]
            success, result = self.run_graphql_query(
                {
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
                            "name": "New new name",
                        }
                    },
                },
                user=user,
            )
            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)

    def test_delete_team(self):
        """Admin can delete teams after removing users and programs."""
        user = self.test_users["admin"]
        team_id = "472d17da-ff8b-4743-823f-3f01ea21a349"
        team = self.session.query(Team).get(team_id)
        team.users = []
        team.programs = [
            self.session.query(Program).get("1e73e788-0808-4ee8-9b25-682b6fa3868b")
        ]
        self.session.add(team)
        self.session.commit()

        success, result = self.run_graphql_query(
            {
                "operationName": "DeleteTeam",
                "query": """
                mutation DeleteTeam($id: ID!) {
                    deleteTeam(id: $id)
                }
            """,
                "variables": {
                    "id": team_id,
                },
            },
            user=user,
        )
        assert success
        assert len(result["errors"]) == 1

        team = self.session.query(Team).get(team_id)
        assert team
        team.users = [self.test_users["normal"]]
        team.programs = []
        self.session.add(team)
        self.session.commit()

        success, result = self.run_graphql_query(
            {
                "operationName": "DeleteTeam",
                "query": """
                mutation DeleteTeam($id: ID!) {
                    deleteTeam(id: $id)
                }
            """,
                "variables": {
                    "id": team_id,
                },
            },
            user=user,
        )

        assert success
        assert len(result["errors"]) == 1
        team = self.session.query(Team).get(team_id)
        assert team
        team.users = []
        team.programs = []
        self.session.add(team)
        self.session.commit()

        # Finally should work!
        success, result = self.run_graphql_query(
            {
                "operationName": "DeleteTeam",
                "query": """
                mutation DeleteTeam($id: ID!) {
                    deleteTeam(id: $id)
                }
            """,
                "variables": {
                    "id": team_id,
                },
            },
            user=user,
        )

        assert success
        assert result["data"]["deleteTeam"] == team_id
        assert not self.session.query(Team).get(team_id)

    def test_delete_team_no_perm(self):
        """Only admins can delete teams."""
        for user in ["normal", "other"]:
            user = self.test_users[user]
            team_id = "472d17da-ff8b-4743-823f-3f01ea21a349"
            # Confirm Team exists, then that it does not.
            existing_team = self.session.query(Team).filter(Team.id == team_id)
            # Count of existing Team should be one
            self.assertEqual(existing_team.count(), 1)
            success, result = self.run_graphql_query(
                {
                    "operationName": "DeleteTeam",
                    "query": """
                    mutation DeleteTeam($id: ID!) {
                        deleteTeam(id: $id)
                    }
                """,
                    "variables": {
                        "id": team_id,
                    },
                },
                user=user,
            )
            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)
            team = self.session.query(Team).filter(Team.id == team_id)
            self.assertEqual(team.count(), 1)
            program = self.session.query(Program).filter(Program.team_id == team_id)
            self.assertEqual(program.count(), 1)
            # Adding raw SQL query to hit join table
            query = sqlalchemy.text(
                f'SELECT * FROM user_team WHERE team_id = "{team_id}"'
            )
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
            success, result = self.run_graphql_query(
                {
                    "operationName": "GetUsers",
                    "query": """
                    query GetUsers {
                        users {
                            email
                            active
                        }
                    }
                """,
                },
                user=user,
            )
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
            success, result = self.run_graphql_query(
                {
                    "operationName": "GetTeams",
                    "query": """
                    query GetTeams {
                        teams {
                            name
                        }
                    }
                """,
                },
                user=user,
            )
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
            success, result = self.run_graphql_query(
                {
                    "operationName": "GetRoles",
                    "query": """
                    query GetRoles {
                        roles {
                            name
                        }
                    }
                """,
                },
                user=user,
            )
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

    def test_query_program(self):
        """Test that programs can be queried.
        Users on the right team and admins should be able to query programs.
        """
        for user_role in ["admin", "normal"]:
            user = self.test_users[user_role]
            success, result = self.run_graphql_query(
                {
                    "operationName": "QueryProgram",
                    "query": """
                    query QueryProgram($id: ID!) {
                       program(id: $id) {
                            id
                            description
                            datasets {
                                id
                                name
                            }
                       }
                    }
                """,
                    "variables": {
                        "id": "1e73e788-0808-4ee8-9b25-682b6fa3868b",
                    },
                },
                user=user,
            )

            self.assertTrue(success)
            self.assertEqual(
                result,
                {
                    "data": {
                        "program": {
                            "id": "1e73e788-0808-4ee8-9b25-682b6fa3868b",
                            "description": "All BBC news programming",
                            "datasets": [
                                {
                                    "id": "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89",
                                    "name": "Breakfast Hour",
                                },
                                {
                                    "id": "96336531-9245-405f-bd28-5b4b12ea3798",
                                    "name": "12PM - 4PM",
                                },
                            ],
                        },
                    },
                },
            )

    def test_query_program_no_perm(self):
        """Test that programs can't be queried by users on the wrong team."""
        success, result = self.run_graphql_query(
            {
                "operationName": "QueryProgram",
                "query": """
                query QueryProgram($id: ID!) {
                   program(id: $id) {
                        id
                   }
                }
            """,
                "variables": {
                    "id": "1e73e788-0808-4ee8-9b25-682b6fa3868b",
                },
            },
            user=self.test_users["other"],
        )

        self.assertTrue(success)
        self.assertResultWasNotAuthed(result)

    def test_create_program(self):
        """Admins should be able to create new programs."""
        users = [
            ["other", False],
            ["normal", False],
            ["admin", True],
            [None, False],
        ]

        # Add a gender to the database before the query to ensure it gets
        # properly gets deduped.
        s = self.Session()
        s.add(CategoryValue(name="gender1"))
        s.commit()
        s.close()

        for user_id, should_auth in users:
            user = self.test_users.get(user_id)
            success, result = self.run_graphql_query(
                {
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
                                personTypes {
                                    personTypeName
                                }
                            }
                            targets {
                                target
                            }
                            tags {
                                name
                            }
                        }
                    }        
                """,
                    "variables": {
                        "input": {
                            "name": "A New Program!",
                            "description": "A very new program",
                            "teamId": "472d17da-ff8b-4743-823f-3f01ea21a349",
                            "datasets": [
                                {
                                    "name": "A new dataset",
                                    "description": "Some new dataset",
                                    "personTypes": ["BBC CONTRIBUTOR", "another"],
                                }
                            ],
                            "targets": [
                                {
                                    "categoryValue": {
                                        "name": "gender1",
                                        "category": {
                                            "id": "51349e29-290e-4398-a401-5bf7d04af75e"
                                        },
                                    },
                                    "target": 0.5,
                                },
                                {
                                    "categoryValue": {
                                        "name": "gender2",
                                        "category": {
                                            "id": "51349e29-290e-4398-a401-5bf7d04af75e"
                                        },
                                    },
                                    "target": 0.5,
                                },
                            ],
                            "tags": [{"id": "4a2142c0-5416-431d-b62f-0dbfe7574688"}],
                        }
                    },
                },
                user=user,
            )

            self.assertTrue(success)
            if not should_auth:
                self.assertResultWasNotAuthed(result)
            else:
                self.assertTrue(
                    self.is_valid_uuid(result["data"]["createProgram"]["id"]),
                    "Invalid UUID",
                )
                self.assertEqual(
                    result,
                    {
                        "data": {
                            "createProgram": {
                                "id": result["data"]["createProgram"]["id"],
                                "name": "A New Program!",
                                "description": "A very new program",
                                "team": {"name": "News Team"},
                                "tags": [{"name": "News"}],
                                "datasets": [
                                    {
                                        "name": "A new dataset",
                                        "personTypes": [
                                            {"personTypeName": "BBC Contributor"},
                                            {"personTypeName": "another"},
                                        ],
                                    }
                                ],
                                "targets": [{"target": 0.5}, {"target": 0.5}],
                            },
                        },
                    },
                )

        # Ensure gender1 was deduped
        s = self.Session()
        assert (
            s.query(CategoryValue).filter(CategoryValue.name == "Gender1").count() == 1
        )
        s.close()

    def test_update_program(self):
        """Test that admins can update Programs."""
        users = [
            ["other", False],
            ["normal", False],
            ["admin", True],
            [None, False],
        ]

        # Add a gender to the database before the query to ensure it gets
        # properly gets deduped.
        s = self.Session()
        s.add(CategoryValue(name="existing gender"))
        s.commit()
        s.close()

        for user_id, should_auth in users:
            user = self.test_users.get(user_id)
            success, result = self.run_graphql_query(
                {
                    "operationName": "UpdateProgram",
                    "query": """
                    mutation UpdateProgram($input: UpdateProgramInput!) {
                        updateProgram(input: $input) {
                            id
                            name
                            targets {
                                target
                                categoryValue {
                                    name
                                }
                            }
                            datasets {
                                name
                                personTypes {
                                    personTypeName
                                }
                            }
                            tags {
                                name
                            }
                            
                       }
                    }
                """,
                    "variables": {
                        "input": {
                            "id": "1e73e788-0808-4ee8-9b25-682b6fa3868b",
                            "name": "An updated new Program",
                            "targets": [
                                {
                                    "id": "40eaeafc-3311-4294-a639-a826eb6495ab",
                                    "target": 0.17,
                                },  # NonBinary
                                {
                                    "id": "2d501688-92e3-455e-9685-01141de3dbaf",
                                    "target": 0.16,
                                },  # CisMen
                                {
                                    "id": "4f7897c2-32a1-4b1e-9749-1a8066faca01",
                                    "target": 0.17,
                                },  # TransWomen
                                {
                                    "categoryValue": {
                                        "name": "new gender",
                                        "category": {
                                            "id": "51349e29-290e-4398-a401-5bf7d04af75e"
                                        },
                                    },
                                    "target": 0.3,
                                },
                                {
                                    "categoryValue": {
                                        "name": "existing gender",
                                        "category": {
                                            "id": "51349e29-290e-4398-a401-5bf7d04af75e"
                                        },
                                    },
                                    "target": 0.2,
                                },
                            ],
                            "datasets": [
                                {
                                    "id": "b3e7d42d-2bb7-4e25-a4e1-b8d30f3f6e89"
                                },  # Existing dataset 'Breakfast Hour'
                                {
                                    "name": "Some new dataset",
                                    "description": "for testing",
                                    "personTypes": ["one", "two", "BBC CONTRIBUTOR"],
                                },  # New one
                            ],
                            "tags": [
                                {
                                    "id": "4a2142c0-5416-431d-b62f-0dbfe7574688"
                                },  # Existing tag 'news'
                                {
                                    "name": "new tag",
                                    "description": "my new tag",
                                },  # New tag
                            ],
                        }
                    },
                },
                user=user,
            )

            self.assertTrue(success)
            if not should_auth:
                self.assertResultWasNotAuthed(result)
            else:
                self.assertTrue(
                    self.is_valid_uuid(result["data"]["updateProgram"]["id"]),
                    "Invalid UUID",
                )
                self.assertEqual(
                    result,
                    {
                        "data": {
                            "updateProgram": {
                                "id": "1e73e788-0808-4ee8-9b25-682b6fa3868b",
                                "name": "An updated new Program",
                                "targets": [
                                    {
                                        "categoryValue": {"name": "Non-binary"},
                                        "target": 0.17,
                                    },
                                    {
                                        "categoryValue": {"name": "Men"},
                                        "target": 0.16,
                                    },
                                    {
                                        "categoryValue": {"name": "Trans women"},
                                        "target": 0.17,
                                    },
                                    {
                                        "categoryValue": {"name": "New gender"},
                                        "target": 0.3,
                                    },
                                    {
                                        "categoryValue": {"name": "Existing gender"},
                                        "target": 0.2,
                                    },
                                ],
                                "datasets": [
                                    {
                                        "name": "Breakfast Hour",
                                        "personTypes": [
                                            {"personTypeName": "BBC Contributor"},
                                            {"personTypeName": "Non-BBC Contributor"},
                                        ],
                                    },
                                    {
                                        "name": "Some new dataset",
                                        "personTypes": [
                                            {"personTypeName": "BBC Contributor"},
                                            {"personTypeName": "one"},
                                            {"personTypeName": "two"},
                                        ],
                                    },
                                ],
                                "tags": [
                                    {"name": "News"},
                                    {"name": "New tag"},
                                ],
                            },
                        },
                    },
                )

        # Ensure existing gender was deduped
        s = self.Session()
        assert (
            s.query(CategoryValue)
            .filter(CategoryValue.name == "Existing gender")
            .count()
            == 1
        )
        s.close()

    def test_update_program_dedupes_tag_names(self):
        """Make sure tags are never duplicated even if they are passed as new."""
        success, result = self.run_graphql_query(
            {
                "operationName": "UpdateProgram",
                "query": """
                mutation UpdateProgram($input: UpdateProgramInput!) {
                    updateProgram(input: $input) {
                        tags {
                            id
                            name
                        }
                    }
                }
            """,
                "variables": {
                    "input": {
                        "id": "1e73e788-0808-4ee8-9b25-682b6fa3868b",
                        # "News" tag already exists with a different case. This
                        # should be caught by the API and re-used.
                        "tags": [{"name": "news"}],
                    }
                },
            },
            user=self.test_users["admin"],
        )

        assert success
        assert result == {
            "data": {
                "updateProgram": {
                    "tags": [
                        {
                            "id": "4a2142c0-5416-431d-b62f-0dbfe7574688",
                            "name": "News",
                        },
                    ]
                },
            },
        }

    def test_delete_program(self):
        """Only admins can delete programs."""
        user = self.test_users["admin"]
        program_id = "1e73e788-0808-4ee8-9b25-682b6fa3868b"
        # Confirm Program exists, then that it does not.
        existing_program = Program.get_not_deleted(self.session, program_id)
        # Existing Program should not be None
        self.assertNotEqual(existing_program, None)
        success, result = self.run_graphql_query(
            {
                "operationName": "DeleteProgram",
                "query": """
                mutation DeleteProgram($id: ID!) {
                    deleteProgram(id: $id)
                }
            """,
                "variables": {
                    "id": program_id,
                },
            },
            user=user,
        )
        self.assertTrue(success)
        program = Program.get_not_deleted(self.session, program_id)
        self.assertEqual(program, None)

        # check that Dataset, Record, Entry, Target were also soft deleted
        datasets = (
            self.session.query(Dataset).filter(Dataset.program_id == program_id).all()
        )
        for dataset in datasets:
            self.assertNotEqual(dataset.deleted, None)
            records = (
                self.session.query(Record).filter(Record.dataset_id == dataset.id).all()
            )
            for record in records:
                self.assertNotEqual(record.deleted, None)
                entries = (
                    self.session.query(Entry)
                    .filter(Entry.record_id == record.id, Entry.deleted == None)
                    .first()
                )
                self.assertEqual(entries, None)

        targets = (
            self.session.query(Target)
            .filter(Target.program_id == program_id, Target.deleted == None)
            .first()
        )
        self.assertEqual(targets, None)

        self.assertTrue(self.is_valid_uuid(program_id), "Invalid UUID")
        self.assertEqual(
            result,
            {
                "data": {"deleteProgram": program_id},
            },
        )

    def test_delete_program_no_perm(self):
        """Only admins can delete Programs."""
        for user in ["normal", "other"]:
            user = self.test_users[user]
            program_id = "1e73e788-0808-4ee8-9b25-682b6fa3868b"
            # Confirm Program exists, then that it does not.
            existing_program = Program.get_not_deleted(self.session, program_id)
            # Existing Program should not be None
            self.assertNotEqual(existing_program, None)
            success, result = self.run_graphql_query(
                {
                    "operationName": "DeleteProgram",
                    "query": """
                    mutation DeleteProgram($id: ID!) {
                        deleteProgram(id: $id)
                    }
                """,
                    "variables": {
                        "id": program_id,
                    },
                },
                user=user,
            )
            self.assertTrue(success)
            self.assertResultWasNotAuthed(result)
            program = Program.get_not_deleted(self.session, program_id)
            self.assertNotEqual(program, None)

    async def test_first_time_app_configure(self):
        """Test that the app can be configured if it's in the blank state."""
        success, result = await self.run_graphql_query(
            {
                "operationName": "ConfigureApp",
                "query": """
                mutation ConfigureApp($input: FirstTimeAppConfigurationInput!) {
                    configureApp(input: $input)
                }
            """,
                "variables": {
                    "input": {
                        "organization": "My Org",
                        "email": "me@notrealemail.info",
                        "firstName": "Tina",
                        "lastName": "Turner",
                    },
                },
            },
            user=None,
            is_async=True,
        )

        assert success
        self.assertResultWasNotAuthed(result)

        self.tearDown()
        self.setUp(with_dummy_data=False)

        success, result = await self.run_graphql_query(
            {
                "operationName": "ConfigureApp",
                "query": """
                mutation ConfigureApp($input: FirstTimeAppConfigurationInput!) {
                    configureApp(input: $input)
                }
            """,
                "variables": {
                    "input": {
                        "organization": "My Org",
                        "email": "me@notrealemail.info",
                        "firstName": "Tina",
                        "lastName": "Turner",
                    },
                },
            },
            user=None,
            is_async=True,
        )

        assert success
        assert self.is_valid_uuid(result["data"]["configureApp"])

        user = User.get_by_email(self.session, "me@notrealemail.info")

        _, orgs = await self.run_graphql_query(
            {
                "operationName": "Orgs",
                "query": """
                query Orgs {
                    organizations {
                        name
                    }
                }
            """,
            },
            user=user,
            is_async=True,
        )
        assert orgs["data"]["organizations"] == [{"name": "My Org"}]


if __name__ == "__main__":
    unittest.main()
