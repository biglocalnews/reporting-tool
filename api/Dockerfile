FROM python:3.9-buster

ENV DEBIAN_FRONTEND noninteractive

# Install postgres dev stuff for psycopg, and psql for other CLI scripts
RUN apt update && apt install -y libpq-dev postgresql-client pkg-config libxml2-dev libxmlsec1-dev

RUN mkdir /app
WORKDIR /app

COPY install_kerberos.sh install_kerberos.sh

RUN bash install_kerberos.sh

COPY requirements.txt requirements.txt

RUN pip3 install -r requirements.txt

ENV rt_debug=False

COPY . .

EXPOSE 8000

ENTRYPOINT [ "bash", "start.sh" ]
