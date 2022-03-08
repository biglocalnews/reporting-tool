FROM python:3.9-buster

ENV DEBIAN_FRONTEND noninteractive

# Install postgres dev stuff for psycopg, and psql for other CLI scripts
RUN apt update && apt install -y libpq-dev postgresql-client pkg-config libxml2-dev libxmlsec1-dev

RUN mkdir /app
WORKDIR /app

COPY requirements.txt requirements.txt

RUN pip3 install -r requirements.txt

COPY . .

RUN bash install_kerberos.sh

ENTRYPOINT [ "bash", "start.sh" ]
