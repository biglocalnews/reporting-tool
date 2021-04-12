INSERT INTO
    organization
VALUES
    (1, 'BBC');

INSERT INTO
    team
VALUES
    (1, 'News team', 1, now());

INSERT INTO
    "user"
VALUES
    (
        'cd7e6d44-4b4d-4d7a-8a67-31efffe53e77',
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
        'cd7e6d44-4b4d-4d7a-8a67-31efffe53e77'
    ),
    (
        2,
        '12PM - 4PM',
        'afternoon programming',
        1,
        'cd7e6d44-4b4d-4d7a-8a67-31efffe53e77'
    );