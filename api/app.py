import uvicorn
from fastapi import FastAPI

from ariadne import load_schema_from_path, make_executable_schema, snake_case_fallback_resolvers, ObjectType
from ariadne.asgi import GraphQL

from queries import query
from mutations import mutation

app = FastAPI()

type_defs = load_schema_from_path("schema.graphql")
schema = make_executable_schema(
    type_defs, query, mutation, snake_case_fallback_resolvers
)

app.mount("/graphql", GraphQL(schema, debug=True))

@app.get("/")

def home():
    return "Ahh!! Aliens!"

if __name__ == "__main__":
    uvicorn.run("app:app")
