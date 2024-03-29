from datetime import datetime, timedelta
from typing import Dict
from unicodedata import category
from sqlalchemy import and_, column, func, select, subquery, text
from sqlalchemy.orm import Session
from database import Dataset, Program, PublishedRecordSet, ReportingPeriod, Tag, Team
from enum import Enum
import logging


def get_basic_stats(session: Session):
    stats = {}

    stmt = select(func.count()).select_from(Team).where(Team.deleted == None)
    team_count = session.scalar(stmt)
    stats["teams"] = team_count

    stmt = select(func.count()).select_from(Dataset).where(Dataset.deleted == None)
    datasets_count = session.scalar(stmt)
    stats["datasets"] = datasets_count

    stmt = select(func.count()).select_from(Tag).where(Tag.deleted == None)
    tags_count = session.scalar(stmt)
    stats["tags"] = tags_count

    return stats


def get_overviews(session: Session):
    categories = ["Gender", "Ethnicity", "Disability"]
    filters = [{"name": "Everyone", "filter": True}]

    """
    additional filters
    {
        "name": "Minus Music and Sport",
        "filter": func.jsonb_path_exists(
            PublishedRecordSet.document,
            f'$.datasetGroupTags[*].group ? (@ like_regex "music|sport" flag "i")',
        )
        == False,
    },
    {
        "name": "Minus Music",
        "filter": func.jsonb_path_exists(
            PublishedRecordSet.document,
            f'$.datasetGroupTags[*].group ? (@ like_regex "music" flag "i")',
        )
        == False,
    },
    {
        "name": "Minus Sport",
        "filter": func.jsonb_path_exists(
            PublishedRecordSet.document,
            f'$.datasetGroupTags[*].group ? (@ like_regex "sport" flag "i")',
        )
        == False,
    },
    """

    overviews = []

    for category in categories:
        for filter in filters:

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
                    .filter(filter["filter"])
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

                res = session.execute(stmt)

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
                ] in res:

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
                    "filter": filter["name"],
                }
                overviews.append(proto)
                overviews.append(
                    {
                        **proto,
                        "target_state": target_state.lt5.name,
                        "value": scores[target_state.lt5],
                    }
                )
                overviews.append(
                    {
                        **proto,
                        "target_state": target_state.lt10.name,
                        "value": scores[target_state.lt10],
                    }
                )
                overviews.append(
                    {
                        **proto,
                        "target_state": target_state.gt10.name,
                        "value": scores[target_state.gt10],
                    }
                )

    return overviews


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

        res = session.execute(stmt)

        target_state = Enum("target_state", "exceeds fails")

        for [
            dataset_id,
            dataset_name,
            prs_id,
            date_end,
            percents,
            oot_percents,
            target,
        ] in res:

            target_members_sum = sum(percents)
            oot_target_members_sum = sum(oot_percents)

            if not target_members_sum or not target:
                continue

            dataset_details = {
                "reporting_period_end": date_end,
                "category": category,
                "prs_id": prs_id,
                "dataset_id": dataset_id,
                "name": dataset_name,
                "percent": target_members_sum,
                "target": round(target),
            }

            if target_members_sum >= target:
                stats["target_states"].append(
                    {**dataset_details, "state": target_state.exceeds.name}
                )
            else:
                stats["target_states"].append(
                    {**dataset_details, "state": target_state.fails.name}
                )


def get_admin_needs_attention(stats: Dict, session: Session):

    stats["needs_attention"] = []

    today = datetime.today()
    first = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    end_of_last_month = first - timedelta(microseconds=1)

    stmt = (
        select(
            Dataset.id,
            Dataset.name,
            ReportingPeriod.id,
            ReportingPeriod.program_id,
            ReportingPeriod.description,
            ReportingPeriod.end,
            PublishedRecordSet.id,
            PublishedRecordSet.created,
            PublishedRecordSet.document,
        )
        .select_from(ReportingPeriod)
        .join(
            Dataset,
            and_(
                ReportingPeriod.program_id == Dataset.program_id,
                ReportingPeriod.end <= end_of_last_month,
            ),
        )
        .outerjoin(ReportingPeriod.published_record_set)
        .order_by(ReportingPeriod.end.desc())
    )

    res = session.execute(stmt)

    result_list = [x for x in res]

    dataset_ids = set([x[0] for x in result_list])

    datasets_needing_attention = {}

    for dataset_id in dataset_ids:

        dataset_rps = [x for x in result_list if x[0] == dataset_id]

        if not len(dataset_rps):
            continue

        proto = {
            "dataset_id": dataset_id,
            "reporting_period_end": dataset_rps[0][5],
            "reporting_period_name": dataset_rps[0][4],
            "name": dataset_rps[0][1],
            "count": 0,
        }

        targets_missed = {}

        for i, dataset_rp in enumerate(dataset_rps):

            if i > 2:
                break

            document = dataset_rp[8]

            if not document:
                continue

            if not "targets" in document:
                continue

            targets = document["targets"]

            if not "record" in document or not "Everyone" in document["record"]:
                continue

            categories = document["record"]["Everyone"]

            for category, entries in categories.items():
                if "entries" not in entries:
                    continue

                targets_int = [
                    x["target"] for x in targets if x["category"] == category
                ]

                if not targets_int:
                    logging.error(
                        f"Category {category} has no targets, possibly due to nothing in the published record set. Dateset Id is {dataset_id}"
                    )
                    continue

                [target, *_] = targets_int

                if not target:
                    continue

                if category not in targets_missed:
                    targets_missed[category] = 0
                target_member_count = 0
                total_count = 0
                for attribute, entry in entries["entries"].items():
                    if not entry["percent"]:
                        continue
                    total_count += entry["percent"]
                    if entry["targetMember"]:
                        target_member_count += entry["percent"]

                if not total_count:
                    # everything was 0, so nothing recorded
                    continue

                if target_member_count < target:
                    targets_missed[category] += 1
                    if targets_missed[category] == 3:
                        if dataset_id in datasets_needing_attention:
                            if (
                                "MissedATargetInAllLast3Periods"
                                not in datasets_needing_attention[dataset_id][
                                    "needs_attention_types"
                                ]
                            ):
                                datasets_needing_attention[dataset_id][
                                    "needs_attention_types"
                                ].append("MissedATargetInAllLast3Periods")
                        else:
                            datasets_needing_attention[dataset_id] = {
                                **proto,
                                "needs_attention_types": [
                                    "MissedATargetInAllLast3Periods"
                                ],
                            }
                    target_delta = target - target_member_count
                    if target_delta >= 10:
                        if dataset_id in datasets_needing_attention:
                            if (
                                "MoreThan10PercentBelowATargetLastPeriod"
                                not in datasets_needing_attention[dataset_id][
                                    "needs_attention_types"
                                ]
                            ):
                                datasets_needing_attention[dataset_id][
                                    "needs_attention_types"
                                ].append("MoreThan10PercentBelowATargetLastPeriod")
                        else:
                            datasets_needing_attention[dataset_id] = {
                                **proto,
                                "needs_attention_types": [
                                    "MoreThan10PercentBelowATargetLastPeriod"
                                ],
                            }

        if len(dataset_rps) < 3:
            continue

        last_3 = [x for x in dataset_rps][:3]

        if all([x[6] == None for x in last_3]):
            if dataset_id in datasets_needing_attention:
                datasets_needing_attention[dataset_id]["needs_attention_types"].append(
                    "NothingPublishedLast3Periods"
                )
            else:
                datasets_needing_attention[dataset_id] = {
                    **proto,
                    "needs_attention_types": ["NothingPublishedLast3Periods"],
                }

    stats["needs_attention"] = datasets_needing_attention.values()


def get_admin_overdue(stats: Dict, session: Session):

    stats["overdue"] = []

    today = datetime.today()
    first = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    end_of_last_month = first - timedelta(microseconds=1000)
    start_of_last_month = end_of_last_month.replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )

    stmt = (
        select(
            ReportingPeriod.id,
            ReportingPeriod.program_id,
            ReportingPeriod.description,
            ReportingPeriod.end,
            Dataset.id,
            Dataset.name,
            PublishedRecordSet.id,
        )
        .select_from(ReportingPeriod)
        .filter(
            and_(
                ReportingPeriod.program_id != None,
                ReportingPeriod.end < first,
                ReportingPeriod.end >= start_of_last_month,
            )
        )
        .join(
            Dataset,
            Dataset.program_id == ReportingPeriod.program_id,
        )
        .outerjoin(ReportingPeriod.published_record_set)
    )

    res = session.execute(stmt)

    for [
        rp_id,
        prog_id,
        rp_description,
        date_end,
        dataset_id,
        dataset_name,
        prs_id,
    ] in res:

        if not prs_id:
            dataset_details = {
                "reporting_period_end": date_end,
                "reporting_period_name": rp_description,
                "dataset_id": dataset_id,
                "name": dataset_name,
            }
            stats["overdue"].append(dataset_details)


def get_headline_totals(session: Session):

    headline_totals = {}

    sbqry = (
        select(
            PublishedRecordSet.dataset_id.label("did"),
            func.max(PublishedRecordSet.end).label("date_pos"),
        )
        .select_from(PublishedRecordSet)
        .group_by("did")
        .subquery()
    )

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
        .join(
            sbqry,
            and_(
                sbqry.c.did == PublishedRecordSet.dataset_id,
                PublishedRecordSet.end == sbqry.c.date_pos,
            ),
        )
        .distinct()
    )

    cats = session.execute(stmt)

    for [category] in cats:
        grouped_by_dataset_year = {}
        stmt = (
            select(
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
                column("dataset_id"),
                column("end"),
            )
            .select_from(PublishedRecordSet)
            .join(
                sbqry,
                and_(
                    sbqry.c.did == PublishedRecordSet.dataset_id,
                    PublishedRecordSet.end == sbqry.c.date_pos,
                ),
            )
        )

        percents = session.execute(stmt)

        total = 0
        count = 0
        dataset_set = set()

        for [
            target_member_percent,
            oot_member_percent,
            target,
            dataset_id,
            end,
        ] in percents:

            this_total_in_target = sum(target_member_percent)
            this_total_oot = sum(oot_member_percent)

            if this_total_in_target + this_total_oot == 0:
                # eveything was zero so nothing actually recorded
                continue

            dataset_set.add(dataset_id)

            total += this_total_in_target
            count += 1

        if count > 0:
            headline_totals[category.lower()] = {
                "percent": total / count,
                "no_of_datasets": len(dataset_set),
            }

    return headline_totals


def get_consistencies(session: Session):
    category = "Gender"
    consistency_state = Enum("consistency_state", "met almost failed")
    consistency_threshold = 5

    consistencies_obj = []

    consistency_counts = {}

    grouped_by_dataset_year = {}
    stmt = select(
        func.jsonb_path_query_array(
            PublishedRecordSet.document,
            f'$.segmentedRecord.*.{category}.entries.* ? ((@.percent > 0 || @.percent == 0) && @.targetMember == true)."percent"',
        ),
        func.jsonb_path_query_first(
            PublishedRecordSet.document,
            f'$.targets[*] ? (@.category == "{category}")."target"',
        ),
        column("dataset_id"),
        column("end"),
    ).select_from(PublishedRecordSet)

    percents = session.execute(stmt)

    for [percent, target, dataset_id, end] in percents:
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
    consistencies_obj.extend(
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
    consistencies_obj.extend(
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

    return consistencies_obj
