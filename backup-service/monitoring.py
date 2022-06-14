import os
import boto3
from botocore.config import Config

DEBUG = os.environ.get("rt_debug")

NAMESPACE = "5050"
METRIC_NAME = "BackupRun"
TOPIC_ENDPOINT = "robert.cobain@bbc.co.uk"
AWS_ACCOUNT_ID = "699221667734"
REGION = "eu-west-2"
PERIOD = 86400
EVALUATION_PERIODS = 1
BOTO_CONFIG = Config()

if not DEBUG:
    TOPIC_ENDPOINT = "niproductteam@bbc.co.uk"
    BOTO_CONFIG = Config(
        proxies={
            "https": "http://global-zen.reith.bbc.co.uk:9480/",
            "http": "http://global-zen.reith.bbc.co.uk:9480/",
        }
    )


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
            Period=PERIOD,
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


if __name__ == "__main__":
    setup_alarms()
