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
docker run -v /home/me/.postgres_pass:/run/secrets/5050_db_pass\
 -e POSTGRES_PASSWORD_FILE=/run/secrets/5050_db_pass \
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

## Migrations

50:50 uses the python library Alembic for handling migrations. Migrations are only needed for the deployed, Live version. Migrations are not needed in Dev.

If you are working on the live system the process for updating the database schema is as follows. 

Update the schema in `database.py`

cd into the alembic folder and run, for example,

    alembic revision --autogenerate -m "Added account table"

This will generate the migration script

Then deploy the code to the swarm and from an API node, execute the migration script

    alembic upgrade head

The upgrade code is also found in the entrypoint `start.sh` of the API image. So any new migration scripts that are deployed will automatically be run before the api starts

## Manually editing the database

Sometimes it may be necessary to manually edit some data in the database.  The following code is an example of how you could do that. Basically we just attach to a running API instance (or postgres instance itself) and run psql

    docker exec -it `docker ps --format '{{.ID}}' --filter label=com.docker.swarm.service.name=5050_api` psql -h  5050-db -U postgres

Then inside psql repl, change to the database called rt

    \c rt

Run some SQL, note that 'user' is a keyword in postgres so if you have a table called user, you need to quote it.

    select * from "user";
    
    delete from "user" where id = 'bb213e2f-1660-419e-baa9-30a8fa139b0c';
    
    update "user" set username='HogenMW1' where id='e443d3ca-02d7-4e3d-8b67-191989f63e7f';
    
    insert into role(id,name,description) values('ee2de3ff-e147-453c-b49c-88122e112095','publisher','User can publish records');
    
    select email from "user" group by email having count(*) >1

## Backup Service

`backup-service` is a swarm service for doing the backups. The code that does the actual backup is `db_backup.sh`. It uses aws credentials secret in order to log success or fail and in order to upload to an (encrypted) S3 bucket.

## Restore

In the case that you want to revert to an earlier dump/version of the Db, you have to truncate the database before restoring.

In the case that the database is totally gone, then you need to remember to create the empty database, usually called `rt`

Hop in to your running instance (if using docker) of postgres by running something like, 

    docker exec -it `docker ps --format '{{.ID}}' --filter label=com.docker.swarm.service.name=5050_db` /bin/bash

Then you can run something like,

    psql -U postgres -h localhost rt < rt_2022-05-13.dump

## Re-initialising (when running in swarm) to a blank state

This is something you might do on your dev system, or if restoring a backup.

Oddly there is no such thing as stop service in docker swarm, but you can achieve the same thing by giving the db service a constaint that it doesn't have.

    docker service update --constraint-add no_such_node==true 5050_db

Then you can just remove the data directory and then remove the constraint to make it start again

    rm -rf /mnt/data/postgres/5050
    
    mkdir /mnt/data/postgres/5050
    
    docker service update --constraint-rm no_such_node==true 5050_db