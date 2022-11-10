import os
from time import time, gmtime, strftime


# needed when running in swarm, uniquely identifies the replica, passed in via stack yml
TASK_SLOT = os.environ.get("TASK_SLOT")
SERVICE_NAME = "API"
METRIC_NAME = "HealthCheck"
DEBUG = os.environ.get("rt_debug")


def setup_logging():
    # TODO - setup logging
    pass


def setup_alarms():
    # TODO - setup alerts
    pass


def log_metric(value):
    if DEBUG:
        print(f'[{TASK_SLOT}] METRIC {METRIC_NAME} {strftime("%a, %d %b %Y %H:%M:%S +0000", gmtime())}: {value}')
    # TODO - actual metric logging


def log_event(value):
    if DEBUG:
        print(f'[{TASK_SLOT}] EVENT {strftime("%a, %d %b %Y %H:%M:%S +0000", gmtime())}: {value}')
    # TODO - actual logging


if __name__ == "__main__":
    setup_logging()
    setup_alarms()
