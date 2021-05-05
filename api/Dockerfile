FROM python:3.9-buster

# Install postgres dev stuff for psycopg, and psql for other CLI scripts
RUN apt update && apt install -y libpq-dev postgresql-client

RUN mkdir /app
WORKDIR /app

COPY requirements.txt requirements.txt

RUN pip3 install -r requirements.txt

COPY . .

ENTRYPOINT [ "uvicorn", "app:app", "--uds", "/sock/api" ]
