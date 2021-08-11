import uuid
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
    user = User(
        id="54bdbbef-9294-4ed9-8cd4-592b53e01391",
        email="laratester@test.com",
        hashed_password=hash_test_password("password"),
        first_name="Lara",
        last_name="Joannides",
    )
    session.add(user)

    # Admin user
    admin_user = User(
        id="253c7684-5af4-4018-b26f-d23713a52354",
        email="laraadmintester@test.com",
        hashed_password=hash_test_password("password"),
        first_name="Lara",
        last_name="Joannides",
    )
    admin = session.query(Role).get("be5f8cac-ac65-4f75-8052-8d1b5d40dffe")
    admin_user.roles.append(admin)
    session.add(admin_user)
    session.commit()

    print("✅ done!")


if __name__ == "__main__":
    run()
