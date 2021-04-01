CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

INSERT INTO
    organization
VALUES
    (
        1,
        'BBC',
        '2010-07-19 23:25:33',
        '2015-03-18 18:40:40',
        '2016-09-29 20:36:08'
    );

INSERT INTO
    team
VALUES
    (1, 'News team', 1, now());

INSERT INTO
    "user"
VALUES
    (
        uuid_generate_v4(),
        'tester@notrealemail.info',
        'c053ecf9ed41df0311b9df13cc6c3b6078d2d3c2',
        true,
        false,
        true,
        'Cat',
        'Berry',
        1
    );

INSERT INTO
    role
VALUES
    (
        1,
        'non-admin',
        'User is a team member and has no administrative priveleges'
    );

INSERT INTO
    program
VALUES
    (
        1,
        'BBC News',
        'All BBC news programming',
        1
    );

INSERT INTO
    tag
VALUES
    (
        1,
        'news',
        'tag for all news programming',
        'news'
    );

INSERT INTO
    dataset
VALUES
    (
        1,
        'Breakfast Hour',
        'breakfast hour programming',
        1,
        /* UUID needs to be manually updated from the "user" table the first time */
        'a9a5cf00-4da4-49c7-850a-10ae99b139db'
    ),
    (
        2,
        '12PM - 4PM',
        'afternoon programming',
        1,
        /* UUID needs to be manually updated from the "user" table the first time */
        'a9a5cf00-4da4-49c7-850a-10ae99b139db'
    );