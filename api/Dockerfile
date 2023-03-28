FROM python:3.9-buster

ENV DEBIAN_FRONTEND noninteractive \
      PYTHONFAULTHANDLER=1 \
      PYTHONUNBUFFERED=1 \
      PYTHONHASHSEED=random \
      PIP_NO_CACHE_DIR=off \
      PIP_DISABLE_PIP_VERSION_CHECK=on \
      PIP_DEFAULT_TIMEOUT=100 \
      POETRY_VIRTUALENVS_CREATE=false

# Install postgres dev stuff for psycopg, and psql for other CLI scripts
RUN apt update && apt install -y libpq-dev postgresql-client pkg-config libxml2-dev libxmlsec1-dev

# Set up poetry
RUN pip install poetry==1.3.2

RUN mkdir /app
WORKDIR /app

# Copy dependency manifests
COPY poetry.lock pyproject.toml /code/

# Install dependencies
RUN poetry install --only main --no-interaction --no-ansi

COPY . .

EXPOSE 8000

ENTRYPOINT [ "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "32", "--root-path", "/api" ]
