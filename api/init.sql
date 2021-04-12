CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

INSERT INTO
    role
VALUES
    (
        1,
        '',
        'User is a team member and has no administrative priveleges'
    ),
    (
        2,
        'admin',
        'User is an admin and has administrative priveleges'
    );