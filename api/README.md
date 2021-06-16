# BBC 5050 Reporting Tool- API

## Getting Started

This section lists things you need to get the Reporting Tool API server up and running in a few ez steps!

Backend API
[/api](api)

### Prerequisites

Before you begin, ensure you have met the following requirements:

- You have installed python3
- You have installed postgresql

### First time running things? Look here!

1. Create python virtual environment

Run this in the `api/` directory the first time you set up the project:

```bash
python3.8 -m venv venv
```

2. Set up database

Do this the first time you set up the project.

To play with the schema I'm just using postgres installed via homebrew on my mac. User is root with no password. You can manually run `create database bbc;`, then run `python database.py --dummy-data` after step (4) below to create tables with seed data.

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
  user (id: "cd7e6d44-4b4d-4d7a-8a67-31efffe53e77") {
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
    "tags": [{"name": "East Coast", "description": "i am a new tag!", "tagType": "location"}]
  }
}
```
