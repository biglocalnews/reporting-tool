Api server
===

# Setup

## 1) Create python virtual environment

Run this in the `api/` directory the first time you set up the project:

```bash
python3.8 -m venv venv
```

## 2) Set up database (TODO!!)

Do this the first time you set up the project.

To play with the schema I'm just using mysql installed via homebrew on my mac. User is root with no password. You can manually run `create database bbc;`, then run `python database.py` after step (4) below to create tables. [CHANGE ME LATER]

## 3) Activate the virtual environment

Do this every time you want to work on this api project. From the `api/` directory run:

```bash
. ./venv/bin/activate
```

You can run the `deactivate` command to exit out of the virtual environment.

## 4) Install Python dependencies

Do this whenever dependencies get updated. From the `api/` directory, with the virtual environment activated, run:

```bash
pip install -r requirements.txt
```

