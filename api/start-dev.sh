#!/usr/bin/env bash
set -ex

# Ensure requirements are satisfied
poetry install

# Start the development server
RT_SECRETS_DIR="`git rev-parse --show-toplevel`/secrets" poetry run uvicorn app:app --reload
