# BBC 5050 Reporting Tool- API

## Getting Started

This section lists things you need to get the Reporting Tool API server up and running in a few ez steps!

Backend API
[/api](api)

### Prerequisites

Before you begin, ensure you have met the following requirements:

- You have installed python3
- You have installed postgresql

### Running a docker instance of postgresql for dev

```bash
docker run -v "`git rev-parse --show-toplevel`/secrets/PGPASSFILE.dev:/run/secrets/rt_db_pass"\
 -e POSTGRES_PASSWORD_FILE=/run/secrets/rt_db_pass \
 -e POSTGRES_DB=rt \
 -p 5432:5432 \
 -it postgres:13.2
```

### First time running things? Look here!

1. Create python virtual environment

Run this in the `api/` directory the first time you set up the project:

```bash
python3.8 -m venv venv
```

2. Set up database

Do this the first time you set up the project.

To play with the schema I'm just using postgres installed via homebrew on my mac. User is root with no password. Run `python database.py --dummy-data` after step (4) below to create tables with seed data.

### General Setup!

In your terminal, navigate to the [/api] folder

🌍 set your virtual environment

```bash
source venv/bin/activate
```

🚧 load in required packages

```bash
pip install -r requirements.txt
```

**NOTE** On Apple M1 processors, `openssl` is installed in a directory that `psycopg2` has trouble finding.
You will have to set the paths explicitly to install:

```bash
env LDFLAGS="-I/opt/homebrew/opt/openssl/include -L/opt/homebrew/opt/openssl/lib"
```

🏁 start your new shiny server

```bash
uvicorn app:app --reload
```

3. Usage

Navigate to http://localhost:8000/graphql/ to see your GraphQL Playground in action!

**Important** Most queries / mutations in the GraphQL schema require permissions to run.
In development mode, you can use the `X-User` header to supply a user's email address who
you'd like to run the query as. For example, in the GraphQL playground you can add the headers:

```
{
    "X-User": "tester@notrealemail.info"
}
```

to execute queries as one of the test users.
See the dummy data in `database.py` for more users, or create your own.

Type in your queries/mutations such as:

```graphql
query getUser {
  user(id: "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77") {
    id
    firstName
    lastName
  }
}
```

sample mutation using inputs:

```
mutation createDataset  ($input : CreateDatasetInput) {
  createDataset (input: $input) {
      id
      name
    	program {
        name
      }
    	tags {
        name
      }
  }
}
```

in the playground's query variables section:

```json
{
  "input": {
    "name": "Fun Time",
    "description": "It's always fun during Fun Time!",
    "programId": "1e73e788-0808-4ee8-9b25-682b6fa3868b",
    "inputterId": "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77",
    "tags": [
      {
        "name": "East Coast",
        "description": "i am a new tag!",
        "tagType": "location"
      }
    ]
  }
}
```

### Db Migrations

```shell
cd alembic"
alembic revision --autogenerate -m "Added account table"
alembic upgrade head
```

### Db Hacking

```shell
docker exec -it `docker ps --format '{{.ID}}' --filter label=com.docker.swarm.service.name=5050-api` psql -h 5050-db -U postgres
\c rt
select * from "user";
delete from "user" where id = 'bb213e2f-1660-419e-baa9-30a8fa139b0c';
update "user" set username='HogenMW1' where id='e443d3ca-02d7-4e3d-8b67-191989f63e7f';
insert into role(id,name,description) values('ee2de3ff-e147-453c-b49c-88122e112095','publisher','User can publish records');
select email from "user" group by email having count(*) >1
```
