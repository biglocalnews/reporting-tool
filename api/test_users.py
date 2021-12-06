import datetime
from database import connection, User, Role
from settings import settings


def run():
    """Create tables and dummy data (if requested)."""
    # Database and tables are created automatically when connecting if they
    # don't already exist.
    session = connection()

    if not settings.debug:
        raise RuntimeError("Can't add dummy data when not in a debug environment")

    from passlib.hash import bcrypt

    def hash_test_password(pw: str) -> str:
        # NOTE: Use consistent salt and rounds to eliminate non-determinism in
        # testing. This is obviously not intended to be secure.
        return bcrypt.hash(pw, salt="0" * 22, rounds=4)

    print("👩🏽‍💻 Adding test users ...")
    lara_id = "54bdbbef-9294-4ed9-8cd4-592b53e01391"
    lara_db = session.query(User).get(lara_id)
    if not lara_db:
        lara = User(
            id=lara_id,
            email="laratester@test.com",
            username="laratester@test.com",
            hashed_password=hash_test_password("password"),
            first_name="Lara",
            last_name="Joannides",
            last_changed_password=datetime.datetime.now(),
            last_login=datetime.datetime.now(),
        )
        session.add(lara)

    # Admin user
    lara_admin_id = "253c7684-5af4-4018-b26f-d23713a52354"
    lara_admin_db = session.query(User).get(lara_admin_id)
    if not lara_admin_db:
        lara_admin = User(
            id=lara_admin_id,
            email="laraadmintester@test.com",
            username="laraadmintester@test.com",
            hashed_password=hash_test_password("password"),
            first_name="Lara",
            last_name="Joannides",
            last_changed_password=datetime.datetime.now(),
            last_login=datetime.datetime.now(),
        )
        admin = session.query(Role).get("be5f8cac-ac65-4f75-8052-8d1b5d40dffe")
        lara_admin.roles.append(admin)
        session.add(lara_admin)

    daniel_id = "1d492c1c-426c-44ba-9cee-2e565e868dc1"
    daniel_db = session.query(User).get(daniel_id)
    if not daniel_db:
        daniel = User(
            id=daniel_id,
            email="danieltester@test.com",
            username="danieltester@test.com",
            hashed_password=hash_test_password("password"),
            first_name="Daniel",
            last_name="Weber",
            last_changed_password=datetime.datetime.now(),
            last_login=datetime.datetime.now(),
        )
        session.add(daniel)

    # Admin user
    daniel_admin_id = "38eb8ce1-8456-4ae0-b77c-9bf0d81b6a40"
    daniel_admin_db = session.query(User).get(daniel_admin_id)
    if not daniel_admin_db:
        daniel_admin = User(
            id=daniel_admin_id,
            email="danieladmintester@test.com",
            username="danieladmintester@test.com",
            hashed_password=hash_test_password("password"),
            first_name="Daniel",
            last_name="Weber",
            last_changed_password=datetime.datetime.now(),
            last_login=datetime.datetime.now(),
        )
        admin = session.query(Role).get("be5f8cac-ac65-4f75-8052-8d1b5d40dffe")
        daniel_admin.roles.append(admin)
        session.add(daniel_admin)

    yasmin_id = "4f56c00d-c41a-45e6-b356-ac579f3f61da"
    yasmin_db = session.query(User).get(yasmin_id)
    if not yasmin_db:
        yasmin = User(
            id=yasmin_id,
            email="yasmintester@test.com",
            username="yasmintester@test.com",
            hashed_password=hash_test_password("password"),
            first_name="Yasmin",
            last_name="Khan",
            last_changed_password=datetime.datetime.now(),
            last_login=datetime.datetime.now(),
        )
        session.add(yasmin)

    # Admin user
    yasmin_admin_id = "3c6897d7-759d-4881-8798-34d9f9428b1f"
    yasmin_admin_db = session.query(User).get(yasmin_admin_id)
    if not yasmin_admin_db:
        yasmin_admin = User(
            id=yasmin_admin_id,
            email="yasminadmintester@test.com",
            username="yasminadmintester@test.com",
            hashed_password=hash_test_password("password"),
            first_name="Yasmin",
            last_name="Khan",
            last_changed_password=datetime.datetime.now(),
            last_login=datetime.datetime.now(),
        )
        admin = session.query(Role).get("be5f8cac-ac65-4f75-8052-8d1b5d40dffe")
        yasmin_admin.roles.append(admin)
        session.add(yasmin_admin)

    session.commit()

    print("✅ done!")


if __name__ == "__main__":
    run()
