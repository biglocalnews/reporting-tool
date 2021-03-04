# BBC 5050 Reporting Tool- API

## Getting Started

This section lists things you need to get the Reporting Tool API server up and running in a few ez steps!

Backend API
[/api](api)

### Prerequisites

Before you begin, ensure you have met the following requirements:

- You have installed python3

### Setup!

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
query getMyUsers {
  users {
    users {
      id
      firstName
      lastName
    }
  }
}
```
