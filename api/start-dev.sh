#!/usr/bin/env bash
set -ex

# Make sure venv exists
if [ ! -d "./venv" ]; then
    python3 -m venv venv
fi

# Check if the script was run while already in the venv
_started_in_env=0
if [[ "$VIRTUAL_ENV" == `pwd`'/venv' ]]; then
    _started_in_env=1
else
    . ./venv/bin/activate
fi

# Ensure requirements are satisfied
pip install -r requirements.txt

# Start the development server
RT_SECRETS_DIR="`git rev-parse --show-toplevel`/secrets" uvicorn app:app --reload

# If the script was *not* started in the venv, exit it as the script exits.
if [[ $_started_in_env == 0 ]]; then
    deactivate
fi
