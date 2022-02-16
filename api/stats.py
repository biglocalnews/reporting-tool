from datetime import datetime, timedelta
from typing import Dict
from unicodedata import category
from h11 import Data
from sqlalchemy import and_, column, func, select, subquery
from sqlalchemy.orm import Session
from database import Dataset, PublishedRecordSet
from enum import Enum


def get_overview(stats: Dict, session: Session):
    categories = ["Gender", "Ethnicity", "Disability"]
    stats["overviews"] = []

    for category in categories:

        date_poss = ["min", "max"]

        for date_pos in date_poss:
            funk = (
                func.min(PublishedRecordSet.begin).label("date_pos")
                if date_pos == "min"
                else func.max(PublishedRecordSet.begin).label("date_pos")
            )
            sbqry = (
                select(
                    PublishedRecordSet.dataset_id.label("did"),
                    funk,
                )
                .select_from(PublishedRecordSet)
                .group_by("did")
                .subquery()
            )

            stmt = (
                select(
                    Dataset.id,
                    Dataset.name,
                    PublishedRecordSet.id,
                    func.jsonb_path_query_array(
                        PublishedRecordSet.document,
                        f'$.record.Everyone.{category}.*.* ? ((@.percent > 0 || @.percent == 0) && @.targetMember == true)."percent"',
                    ),
                    func.jsonb_path_query_array(
                        PublishedRecordSet.document,
                        f'$.record.Everyone.{category}.*.* ? ((@.percent > 0 || @.percent == 0) && @.targetMember == false)."percent"',
                    ),
                    func.jsonb_path_query_first(
                        PublishedRecordSet.document,
                        f'$.targets[*] ? (@.category == "{category}")."target"',
                    ),
                )
                .select_from(PublishedRecordSet)
                .join(
                    sbqry,
                    and_(
                        sbqry.c.did == PublishedRecordSet.dataset_id,
                        PublishedRecordSet.begin == sbqry.c.date_pos,
                    ),
                )
                .join(Dataset, PublishedRecordSet.dataset_id == Dataset.id)
                .filter(Dataset.deleted == None)
            )

            res = session.execute(stmt, execution_options={"stream_results": True})

            target_state = Enum("target_state", "exceeds lt5 lt10 gt10 fails")

            scores = {
                target_state.exceeds: 0,
                target_state.lt5: 0,
                target_state.lt10: 0,
                target_state.gt10: 0,
            }

            for [
                dataset_id,
                dataset_name,
                prs_id,
                percents,
                oot_percents,
                target,
            ] in res.yield_per(100):

                if category == "Gender":
                    global_target = 50  # so not in comparison with the individual dataset's target but the BBC global target of 50
                elif category == "Ethnicity":
                    global_target = 20
                elif category == "Disability":
                    global_target = 12
                else:
                    global_target == target

                target_members_sum = sum(percents)
                oot_target_members_sum = sum(oot_percents)

                if target_members_sum >= global_target:
                    scores[target_state.exceeds] += 1
                elif target_members_sum >= global_target - 5:
                    scores[target_state.lt5] += 1
                elif target_members_sum >= global_target - 10:
                    scores[target_state.lt10] += 1
                elif target_members_sum > 0 or oot_target_members_sum > 0:
                    # if these are both zero, then nothing was recorded for gender
                    scores[target_state.gt10] += 1

            proto = {
                "date": date_pos,
                "category": category,
                "target_state": target_state.exceeds.name,
                "value": scores[target_state.exceeds],
            }
            stats["overviews"].append(proto)
            stats["overviews"].append(
                {
                    **proto,
                    "target_state": target_state.lt5.name,
                    "value": scores[target_state.lt5],
                }
            )
            stats["overviews"].append(
                {
                    **proto,
                    "target_state": target_state.lt10.name,
                    "value": scores[target_state.lt10],
                }
            )
            stats["overviews"].append(
                {
                    **proto,
                    "target_state": target_state.gt10.name,
                    "value": scores[target_state.gt10],
                }
            )


def get_admin_overview(stats: Dict, session: Session, duration: int):
    stats["target_states"] = []
    categories = ["Gender", "Ethnicity", "Disability"]
    for category in categories:

        stmt = (
            select(
                Dataset.id,
                Dataset.name,
                PublishedRecordSet.id,
                PublishedRecordSet.end,
                func.jsonb_path_query_array(
                    PublishedRecordSet.document,
                    f'$.record.Everyone.{category}.*.* ? ((@.percent > 0 || @.percent == 0) && @.targetMember == true)."percent"',
                ),
                func.jsonb_path_query_array(
                    PublishedRecordSet.document,
                    f'$.record.Everyone.{category}.*.* ? ((@.percent > 0 || @.percent == 0) && @.targetMember == false)."percent"',
                ),
                func.jsonb_path_query_first(
                    PublishedRecordSet.document,
                    f'$.targets[*] ? (@.category == "{category}")."target"',
                ),
            )
            .select_from(PublishedRecordSet)
            .filter(
                and_(
                    PublishedRecordSet.end
                    >= datetime.today() - timedelta(days=duration),
                    PublishedRecordSet.end <= datetime.now(),
                )
            )
            .join(Dataset, PublishedRecordSet.dataset_id == Dataset.id)
            .filter(Dataset.deleted == None)
        )

        res = session.execute(stmt, execution_options={"stream_results": True})

        target_state = Enum("target_state", "exceeds fails")

        for [
            dataset_id,
            dataset_name,
            prs_id,
            date_end,
            percents,
            oot_percents,
            target,
        ] in res.yield_per(100):

            target_members_sum = sum(percents)
            oot_target_members_sum = sum(oot_percents)

            if not target_members_sum or not target:
                continue

            dataset_details = {
                "date": date_end,
                "category": category,
                "prs_id": prs_id,
                "dataset_id": dataset_id,
                "name": dataset_name,
                "percent": target_members_sum,
                "target": target,
            }

            if target_members_sum >= target:
                stats["target_states"].append(
                    {**dataset_details, "state": target_state.exceeds.name}
                )
            else:
                stats["target_states"].append(
                    {**dataset_details, "state": target_state.fails.name}
                )


def get_headline_totals(stats: Dict, session: Session):
    stmt = (
        select(
            func.jsonb_object_keys(
                func.jsonb_path_query(
                    PublishedRecordSet.document,
                    "$.record.*",
                )
            )
        )
        .select_from(PublishedRecordSet)
        .distinct()
    )

    cats = session.execute(stmt)

    for [category] in cats:
        grouped_by_dataset_year = {}
        stmt = select(
            func.jsonb_path_query_array(
                PublishedRecordSet.document,
                f'$.record.Everyone.{category}.*.* ? ((@.percent > 0 || @.percent == 0) && @.targetMember == true)."percent"',
            ),
            func.jsonb_path_query_first(
                PublishedRecordSet.document,
                f'$.targets[*] ? (@.category == "{category}")."target"',
            ),
            column("dataset_id"),
            column("end"),
        ).select_from(PublishedRecordSet)

        percents = session.execute(stmt, execution_options={"stream_results": True})

        total = 0
        count = 0

        for [percent, target, dataset_id, end] in percents.yield_per(100):
            this_total = sum(percent)
            total += this_total
            count += 1

        stats[category.lower()] = total / count


def get_consistencies(stats: Dict, session: Session):
    category = "Gender"
    consistency_state = Enum("consistency_state", "met almost failed")
    consistency_threshold = 5

    stats["consistencies"] = []

    consistency_counts = {}

    grouped_by_dataset_year = {}
    stmt = select(
        func.jsonb_path_query_array(
            PublishedRecordSet.document,
            f'$.segmentedRecord.*.{category}.entries.* ? ((@.percent > 0 || @.percent == 0) && @.targetMember == true && @.personType like_regex "(?i).*contributor.*")."percent"',
        ),
        func.jsonb_path_query_first(
            PublishedRecordSet.document,
            f'$.targets[*] ? (@.category == "{category}")."target"',
        ),
        column("dataset_id"),
        column("end"),
    ).select_from(PublishedRecordSet)

    percents = session.execute(stmt, execution_options={"stream_results": True})

    for [percent, target, dataset_id, end] in percents.yield_per(100):
        this_total = sum(percent)

        year = end.year
        if dataset_id not in grouped_by_dataset_year:
            grouped_by_dataset_year[dataset_id] = {}

        if year not in grouped_by_dataset_year[dataset_id]:
            grouped_by_dataset_year[dataset_id][year] = []

        if this_total == None or target == None:
            grouped_by_dataset_year[dataset_id][year].append(consistency_state.failed)
        elif this_total >= target:
            grouped_by_dataset_year[dataset_id][year].append(consistency_state.met)
        elif (this_total + consistency_threshold) >= target:
            grouped_by_dataset_year[dataset_id][year].append(consistency_state.almost)
        else:
            grouped_by_dataset_year[dataset_id][year].append(consistency_state.failed)

    for [dataset, years] in grouped_by_dataset_year.items():
        for [year, consistencies] in years.items():
            if year not in consistency_counts:
                consistency_counts[year] = {}
                consistency_counts[year]["consistent"] = 0
                consistency_counts[year]["failed"] = 0
            met = len(
                [True for x in consistencies if x == consistency_state.met]
            ) >= 3 and all(
                [
                    x == consistency_state.met or x == consistency_state.almost
                    for x in consistencies
                ]
            )

            if met:
                consistency_counts[year]["consistent"] += 1
            else:
                consistency_counts[year]["failed"] += 1

    # this suits antd charts
    stats["consistencies"].extend(
        [
            {
                "category": category,
                "year": year,
                "consistency_state": "consistent",
                "value": counts["consistent"],
            }
            for [year, counts] in consistency_counts.items()
        ]
    )
    stats["consistencies"].extend(
        [
            {
                "category": category,
                "year": year,
                "consistency_state": "failed",
                "value": counts["failed"],
            }
            for [year, counts] in consistency_counts.items()
        ]
    )
