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

To play with the schema I'm just using postgres installed via homebrew on my mac. User is root with no password. You can manually run `create database bbc;`, then run `python database.py` after step (4) below to create tables.

### General Setup!

In your terminal, navigate to the [/api] folder

🌍 set your virtual environment

```
source venv/bin/activate
```

🚧 load in required packages

```
pip install -r requirements.txt
```

🏁 start your new shiny server

```
uvicorn app:app --reload
```

Navigate to http://localhost:8000/graphql/ to see your GraphQL Playground in action!
Type in your queries/mutations such as:

```
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
mutation upsertUsers ($userInfo : UpsertUserInput) {
  upsertUser (input: $userInfo) {
    user {
      firstName
      lastName
    }
  }
}
```

in the playground's query variables section:

```
{
  "userInfo": {
    "firstName": "Bob",
    "lastName": "Jeans",
    "email": "bigelow_senior@email.com",
    "role" : "admin"
  }
}
```
