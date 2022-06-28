# Reporting Tool [RT]

## Built using

- Typescript: React, Apollo, AntD
- Python3: FastAPI, Ariadne (GraphQL), SQLAlchemy
- Postgres

## Code

Frontend
[/client](https://github.com/BBCNI/bbc-50-50/tree/main/client)

Backend API
[/api](https://github.com/BBCNI/bbc-50-50/tree/main/api)

## Getting started

The entire stack may be launched using deply_dev.sh It assumes that you have docker with swarm enabled.
If using Windows, the Windows subsystem for Linux works great.  Just install docker as per usual.
For normal dev you should start things manually as described below.

## Secrets

Some secrets are required which are listed at the end of the docker-compose.yml

Some of these secrets have defaults which are found in api/settings.py

These defaults can be overriden by docker secrets and can in turn be overridden by environment variables which must be prefixed by rt_

- rt_db_pw 
  - Postgres database password
- ni-app-tig.keytab
  - a kerberos token to authenticate with the SAP data API - only works in dev over zscaler - not essential if not using the add user page
- rt_app_account_pw
  - the password for the app account - not essential if not using the add user page
- rt_secret
  - used by Fast_API for securing cookies
- 5050-aws-credentials
  - Used for cloudwatch logging and metrics, and also for the backup service to S3 - not essential

## Postgres

The best way to run postgres is using the official docker hub image, for example,

    docker run --name postgres\
    -v /home/me/.postgres_pass:/run/secrets/5050_db_pass\
    -e POSTGRES_PASSWORD_FILE=/run/secrets/5050_db_pass\
    -e POSTGRES_DB=rt -p 5432:5432 -d postgres:13.6

## Seeding the database with data

`seed.py` will create the db tables according to the schema in database.py

`test_users.py` will create some test users

`importer.py` will import data from the old 5050 system

## API

In windows it is best to run it in the Windows subsystem for Linux. Visual Studio code can run inside it and you can debug as usual

cd into the api/ folder

Install the prerequisites,

    pip3 install -r requirements.txt

then run,

    python3 app.py

## Client

cd into the client/ folder

Install the node modules,

    npm install

then run,

    npm start
