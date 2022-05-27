import os
from time import time, gmtime, strftime
import boto3
from botocore.config import Config

NAMESPACE = "5050"
LOG_STREAM_NAME = "HealthStream"
LOG_GROUP_NAME = f"{NAMESPACE}LogGroup"
METRIC_NAME = "HealthCheck"
TOPIC_ENDPOINT = "niproductteam@bbc.co.uk"
AWS_ACCOUNT_ID = "699221667734"
REGION = "eu-west-2"
EVALUATION_PERIODS = 2
BOTO_CONFIG = Config(
    proxies={
        "https": "http://global-zen.reith.bbc.co.uk:9480/",
        "http": "http://global-zen.reith.bbc.co.uk:9480/",
    }
)


def setup_logging():
    cloudwatch_logs = boto3.client("logs", config=BOTO_CONFIG)

    log_groups = cloudwatch_logs.describe_log_groups(logGroupNamePrefix=NAMESPACE)
    if LOG_GROUP_NAME not in [x["logGroupName"] for x in log_groups["logGroups"]]:
        try:
            response = cloudwatch_logs.create_log_group(logGroupName=LOG_GROUP_NAME)
            print(f"Created {LOG_GROUP_NAME}")
        except Exception as ex:
            print(str(ex))
            exit(1)

    log_streams = cloudwatch_logs.describe_log_streams(logGroupName=LOG_GROUP_NAME)

    if LOG_STREAM_NAME not in [x["logStreamName"] for x in log_streams["logStreams"]]:
        try:
            response = cloudwatch_logs.create_log_stream(
                logGroupName=LOG_GROUP_NAME, logStreamName=LOG_STREAM_NAME
            )
            print(f"Created {LOG_STREAM_NAME}")
        except Exception as ex:
            print(str(ex))
            exit(1)


def setup_alarms():

    sns = boto3.client("sns", config=BOTO_CONFIG)

    topic_name = f"{NAMESPACE}{METRIC_NAME}Topic"
    topic_arn = f"arn:aws:sns:{REGION}:{AWS_ACCOUNT_ID}:{topic_name}"

    topics = sns.list_topics()

    if topic_arn not in [x["TopicArn"] for x in topics["Topics"]]:
        topic = sns.create_topic(Name=topic_name)
        print(topic)

    subs = sns.list_subscriptions_by_topic(TopicArn=topic_arn)

    if TOPIC_ENDPOINT not in [x["Endpoint"] for x in subs["Subscriptions"]]:
        sns.subscribe(TopicArn=topic_arn, Protocol="email", Endpoint=TOPIC_ENDPOINT)

    alarm_name = f"{NAMESPACE}{METRIC_NAME}Alarm"

    log_metric(1)  # creates the metric if not there

    cloudwatch = boto3.client("cloudwatch", config=BOTO_CONFIG)

    alarms = cloudwatch.describe_alarms_for_metric(
        Namespace=NAMESPACE, MetricName=METRIC_NAME
    )
    if alarm_name not in [x["AlarmName"] for x in alarms["MetricAlarms"]]:
        print("Alarm not found, creating one")
        cloudwatch.put_metric_alarm(
            AlarmName=alarm_name,
            Namespace=NAMESPACE,
            MetricName=METRIC_NAME,
            Period=60,
            EvaluationPeriods=EVALUATION_PERIODS,
            Statistic="Sum",
            TreatMissingData="breaching",
            Threshold=1,
            ComparisonOperator="LessThanThreshold",
            AlarmActions=[topic_arn],
            OKActions=[topic_arn],
        )


def log_metric(value):
    cloudwatch = boto3.client("cloudwatch", config=BOTO_CONFIG)
    try:
        response = cloudwatch.put_metric_data(
            Namespace=NAMESPACE,
            MetricData=[
                {
                    "MetricName": METRIC_NAME,
                    "Value": value,
                    "Unit": "None",
                },
            ],
        )
    except Exception as ex:
        print(str(ex))


def log_event(value):
    print(f'{strftime("%a, %d %b %Y %H:%M:%S +0000", gmtime())}: {value}')
    cloudwatch_logs = boto3.client("logs", config=BOTO_CONFIG)
    log_stream_sequence_token = None
    token_file_name = "log_stream_sequence_token"
    if os.path.exists(token_file_name):
        with open(token_file_name) as f:
            log_stream_sequence_token = f.read()

    if not log_stream_sequence_token:
        log_streams = cloudwatch_logs.describe_log_streams(logGroupName=LOG_GROUP_NAME)

        # we only expect one
        log_stream_sequence_tokens = [
            x["uploadSequenceToken"]
            for x in log_streams["logStreams"]
            if "uploadSequenceToken" in x and x["logStreamName"] == LOG_STREAM_NAME
        ]

        if log_stream_sequence_tokens:
            log_stream_sequence_token = log_stream_sequence_tokens[0]

    now = int(time() * 1000)  # milliseconds unix time

    try:
        params = {
            "logGroupName": LOG_GROUP_NAME,
            "logStreamName": LOG_STREAM_NAME,
            "logEvents": [{"timestamp": now, "message": value}],
        }

        if log_stream_sequence_token:
            params["sequenceToken"] = log_stream_sequence_token

        response = cloudwatch_logs.put_log_events(**params)

        if "rejectedLogEventsInfo" in response:
            print(response["rejectedLogEventsInfo"])

        if "nextSequenceToken" in response:
            with open(token_file_name, "w+") as f:
                f.write(response["nextSequenceToken"])
    except Exception as ex:
        print(str(ex))


if __name__ == "__main__":
    setup_logging()
    setup_alarms()
