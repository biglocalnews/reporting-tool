"""This script imports reporting data from a Google Sheet into our database."""

from typing import List, Callable, Dict, Union, TypeVar, Optional, Tuple, Set
from datetime import datetime
import os
import logging

import arrow
import tomli
import click
from dateutil.parser import parse as parse_date
from dateutil.tz import tzutc
from pydantic import BaseModel
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

from connection import connection
from database import (
        Organization,
        Program,
        Dataset,
        Category,
        CategoryValue,
        Record,
        Entry,
        Team,
        Target,
        Track,
        ReportingPeriod,
        )


SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]


logger = logging.getLogger(__name__)


class SyncGeneralConfig(BaseModel):
    id: str
    has_header: bool = True
    sheet_id: int
    reporting_period: str
    team: str


class SyncTargetConfig(BaseModel):
    percent: float
    values: List[str]


class SyncColumnsConfig(BaseModel):
    publish_date: str
    program_name: str
    program_id: str
    episode: str
    sub_episode: str
    guest: str
    categories: Dict[str, Union[str, List[str]]]


class SyncConfig(BaseModel):
    general: SyncGeneralConfig
    targets: Dict[str, SyncTargetConfig]
    columns: SyncColumnsConfig


class Row(BaseModel):
    publish_date: datetime
    program_name: str
    program_id: str
    episode: str
    sub_episode: str
    guest: str
    categories: Dict[str, str]



def load_config(path: str) -> SyncConfig:
    """Loads the configuration from the TOML file."""
    with open(path, "rb") as f:
        return SyncConfig.parse_obj(tomli.load(f))


T = TypeVar("T")
U = TypeVar("U")

class ColumnMap:

    def __init__(self, config: SyncColumnsConfig):
        self._config = config
        self._range_map: Dict[str, int] = {}
        self._name_map: Dict[str, List[int]] = {}

        def _flatten_range_cols(cols: Dict, prefix: str = ""):
            """Flattens the column config into a mapping of column name to range."""
            for name, col in cols.items():
                if isinstance(col, str):
                    col = [col]

                if isinstance(col, list):
                    indexes: List[int] = []
                    self._name_map[prefix + name] = indexes
                    for v in col:
                        index = self.index_from_col(v)
                        self._range_map[v] = index
                        indexes.append(index)
                elif isinstance(col, dict):
                    _flatten_range_cols(col, prefix + name + "_")
                else:
                    raise ValueError(f"Invalid column config: {col}")

        _flatten_range_cols(config.dict())

    def categories(self) -> List[Tuple[str, int]]:
        """Get the categorical column names and indexes."""
        return [(name, self.index_from_col(col[0] if isinstance(col, list) else col))
                for name, col in self._config.categories.items()]

    def index_from_col(self, col: str) -> int:
        """Get the column index from the spreadsheet letter column name."""
        index = 0
        for c in col:
            index *= 26
            index += ord(c.upper()) - ord("A") + 1
        return index - 1

    def get_row_indexes(self, name: str) -> List[int]:
        """Gets the row indexes for the given column name."""
        if name not in self._name_map:
            raise AttributeError(f"Column {name} not found in config")
        return self._name_map[name]

    def get_row_value(self, name: str, row: List[T]) -> T:
        """Gets the value for the given column name from the given row.

        If multiple columns are provided, we will effectively use a
        `COALESCE` operation to return the first non-null value.
        """
        indexes = self.get_row_indexes(name)
        value = None
        for index in indexes:
            if index >= len(row):
                continue
            value = row[index]
            if value:
                return value

        return value

    def get_row_values(self, row: List) -> Optional[Row]:
        """Gets the values for the given row."""
        d = {}

        def _fill_values(cols: Dict, values: Dict, prefix: str = ""):
            for name, col in cols.items():
                if isinstance(col, dict):
                    values[name] = {}
                    _fill_values(col, values[name], prefix + name + "_")
                else:
                    values[name] = self.get_row_value(prefix + name, row)
        _fill_values(self._config.dict(), d)

        if d['program_id'] is None:
            return None
        d['publish_date'] = parse_date(d['publish_date'])
        return Row(**d)

    def col_range(self, n: Optional[int] = None) -> str:
        """Get the full range of columns to fetch from the spreadsheet.

        Uses the spreadsheet range notation, like `A:Z` for example.
        """
        last_col_id = max(self._range_map.values())
        last_col = next(c for c, i in self._range_map.items() if i == last_col_id)
        if n is None:
            return f"A:{last_col}"
        return f"A1:{last_col}{n}"


def get_credentials() -> Credentials:
    """Gets the user's oauth2 credentials from the Google Sheets API.

    Stores token in `token.json` for future use.
    """
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file(
            "token.json", SCOPES
        )
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                "credentials.json", SCOPES
            )
            creds = flow.run_local_server(port=0)
        with open("token.json", "w") as token:
            token.write(creds.to_json())
    return creds


def with_creds(func: Callable) -> Callable:
    """Decorator that gets the user's credentials before calling the function."""
    def wrapper(*args, **kwargs):
        creds = get_credentials()
        kwargs["creds"] = creds
        return func(*args, **kwargs)
    return wrapper


@with_creds
def fetch_sheet_data(spreadsheet_id: str, *, sheet_id: int, col_range: str, creds: Credentials, has_header: bool = False) -> List[List[str]]:
    """Fetches data from the Google Sheet.

    The data contains full metadata about each cell, including data validation
    fields and formatting information.
    """
    service = build("sheets", "v4", credentials=creds)

    try:
        sheet = service.spreadsheets()
        result = (
            sheet
            .values()
            .get(spreadsheetId=spreadsheet_id, range=col_range)
            .execute()
        )
        # values = result["sheets"][sheet_id]["data"][0]["rowData"]
        values = result["values"]
        if has_header:
            values = values[1:]
        return values
    except HttpError as e:
        print(f"Error fetching data from Google Sheets: {e}")
        return []


@with_creds
def fetch_sheet_metadata(spreadsheet_id: str, *, sheet_id: int, col_range: str, has_header: bool = False, creds: Credentials) -> List:
    """Fetches distincts for each of the categories."""
    service = build("sheets", "v4", credentials=creds)

    try:
        sheet = service.spreadsheets()
        result = (
            sheet
            .get(spreadsheetId=spreadsheet_id, ranges=col_range, includeGridData=True)
            .execute()
        )
        rows = result["sheets"][sheet_id]["data"][0]["rowData"]
        if has_header:
            rows = rows[1:]
        
        return rows[0]['values']
    except HttpError as e:
        print(f"Error fetching data from Google Sheets: {e}")
        return []


def parse_data(data: Dict, col_map: ColumnMap) -> List[Row]:
    """Parses the data from the Google Sheet into a list of rows."""
    return [col_map.get_row_values(row) for row in data]


def parse_metadata(data: Dict, col_map: ColumnMap) -> Dict[str, Set[str]]:
    """Parses the data from the Google Sheet into a list of rows."""
    metadata = {}
    for name, index in col_map.categories():
        metadata[name] = set()
        if index >= len(data):
            continue
        values = data[index].get('dataValidation', {}).get('condition', {}).get('values', None)
        if values is None:
            continue
        metadata[name] = set(v['userEnteredValue'] for v in values)
    return metadata


def sync_metadata(session, info: Dict):
    """Sync metadata about categories and their distinct values to DB."""
    for name, values in info.items():
        category = Category.get_or_create(session, {
            'name': name,
            'description': 'Category synced automatically from Google Sheets',
            })
        session.flush()

        # Then ensure a CategoryValue object exists for each possible value.
        for value in values:
            if not value:
                continue
            CategoryValue.get_or_create(session, {
                'category': {'id': category.id},
                'name': value,
                })
        session.flush()


def groupby(A: List[T], key: Callable[[T], U]) -> Dict[U, List[T]]:
    """Group a list A by the given key function."""
    groups = {}
    for a in A:
        k = key(a)
        if k not in groups:
            groups[k] = []
        groups[k].append(a)
    return groups


def get_team(session, team_name: str) -> Team:
    """Get the Team by ID or create a special one for the sync."""
    team = session.query(Team).filter(Team.name == team_name).first()
    if not team:
        # Get the first organization and create a team.
        org = session.query(Organization).filter(Organization.deleted == None).first()
        if org is None:
            raise Exception("No organizations exist in the database.")
        team = Team(name=team_name, organization_id=org.id)
        session.add(team)
        session.flush()
    return team


def sync_reporting_periods(session, config: SyncConfig, program: Program, data: List[Row]):
    """Ensure reporting periods exist to span the data."""
    # Find the min date and max date in the data.
    min_date = min(row.publish_date for row in data)
    max_date = max(row.publish_date for row in data)

    # Fetch reporting periods that have already been created for this program.
    existing_periods = {
            (p.begin.replace(tzinfo=tzutc()).timestamp(),
             p.end.replace(tzinfo=tzutc()).timestamp())
            for p in 
            session.query(ReportingPeriod).filter(ReportingPeriod.program_id == program.id).all()
            }

    periods = {
            'monthly': ['month', 'MMM'],
            'yearly': ['year', 'YYYY'],
            'quarterly': ['quarter', 'Q MMM'],  # TODO this is not quite right
            }

    period, fmt = periods[config.general.reporting_period]

    # Start at the beginning of the first reporting period for which we have
    # any row data.
    first_date = arrow.get(min_date).floor(period)
    # Fill through the end of the last year in the data
    last_date = arrow.get(max_date).ceil('year')
    for (begin, end) in arrow.Arrow.interval(period, first_date, last_date):
        # Create the reporting period if it doesn't already exist.
        if (begin.timestamp(), end.timestamp()) not in existing_periods:
            session.add(ReportingPeriod(
                program_id=program.id,
                begin=begin.datetime,
                end=end.datetime,
                description=begin.format(fmt)
                ))

    # Don't try to clean up reporting periods that exist which we didn't infer
    # here, since we don't know if they were created manually or not.

    session.flush()


def sync_targets(session, program: Program, config: Dict[str, SyncTargetConfig]):
    """Make sure that the Targets for this Program are up-to-date."""
    for target_name, target_config in config.items():
        category = Category.get_by_name(session, target_name)
        target = Target.get_or_create(
                session,
                program.id,
                {'target': target_config.percent / 100.0},
                category.id)
        session.flush()


        # Now ensure that the components of the target exist.
        cvs = session.query(CategoryValue).filter(CategoryValue.category_id == category.id, CategoryValue.deleted == None).all()

        tracked_values = set(target_config.values)
        for cv in cvs:
            Track.get_or_create(session, target.id, cv.id, {
                "target_member": cv.name in tracked_values,
                })
    session.flush()


def sync_data(session, config: SyncConfig, rows: List[Row]):
    """Syncs the data from the Google Sheet into the database."""
    grouped_rows = groupby(rows, lambda r: r.program_id)

    team = get_team(session, config.general.team)

    # Use the first row to get attributes about the program; they will be the
    # same for all the rows in the group.
    row = rows[0]
    # First ensure that the Program exists.
    program = session.query(Program).filter(Program.name == row.program_name).first()
    # If it doesn't exist, create it.
    if program is None:
        program = Program(
                name=row.program_name,
                description="Synced automatically from Google Sheets",
                reporting_period_type="custom",
                team_id=team.id,
                )
        session.add(program)
        session.flush()

    # Now ensure that the Dataset exists for this program.
    dataset = session.query(Dataset).filter(Dataset.program_id == program.id, Dataset.name == row.program_name).first()
    # If it doesn't exist, create it.
    if dataset is None:
        dataset = Dataset(
                name=row.program_name,
                description="Synced automatically from Google Sheets",
                program_id=program.id)
        session.add(dataset)
        session.flush()

    # Iterate over every episode and aggregate / sync data for each into a
    # new Record object.
    for id_, entries in grouped_rows.items():
        # Use the first row to get attributes about the episode.
        row = entries[0]
        # Now ensure a record exists for this row.
        record = session.query(Record).filter(Record.dataset_id == dataset.id, Record.publication_date == row.publish_date).first()
        # If it exists, move on.
        if record is not None:
            logging.warn("Record already exists for dataset %s and date %s. Replacing existing entries with new data from the sheet!",
                         dataset.name, row.publish_date)
            session.query(Entry).filter(Entry.record_id == record.id).delete()
            session.flush()
        else:
            record = Record(dataset_id=dataset.id, publication_date=row.publish_date)
            session.add(record)
            session.flush()

        # Create entries for each category.
        for catname in row.categories.keys():
            category = Category.get_by_name(session, catname)
            if category is None:
                logger.warning(f"Category {category} not found in DB")
                continue

            # Aggregate each unique value for this category.
            values: Dict[str, int] = {}
            for entry in entries:
                value = entry.categories.get(catname, None)
                if value is None:
                    continue
                if value not in values:
                    values[value] = 0
                values[value] += 1

            # Now create an Entry representing each count.
            for value, count in values.items():
                if not value:
                    logger.warning("Skipping empty value!")
                    continue
                category_value = CategoryValue.get_or_create(session, {
                    'category': {'id': category.id},
                    'name': value,
                    })
                session.flush()

                if category_value is None:
                    logger.warning(f"Category value {value} not found in DB")
                    continue
                entry = Entry(
                        record_id=record.id,
                        category_value_id=category_value.id,
                        count=count,
                        )
                session.add(entry)
                session.flush()

    # Sync reporting period information
    sync_reporting_periods(session, config, program, rows)

    # Sync targets
    sync_targets(session, program, config.targets)

    # TODO - custom column values


@click.command()
@click.argument("config_path", type=click.Path(exists=True))
def main(config_path: str):
    """Imports reporting data from a Google Sheet into our database."""
    config = load_config(config_path)
    col_map = ColumnMap(config.columns)

    # Fetch metadata about columns and possible values from the sheet.
    metadata = fetch_sheet_metadata(
            config.general.id,
            sheet_id=config.general.sheet_id,
            col_range=col_map.col_range(2),
            has_header=config.general.has_header)
    info = parse_metadata(metadata, col_map)

    # Fetch entry data from the sheet.
    data = fetch_sheet_data(
            config.general.id,
            sheet_id=config.general.sheet_id,
            col_range=col_map.col_range(),
            has_header=config.general.has_header)
    rows = parse_data(data, col_map)

    session = connection()
    sync_metadata(session, info)
    sync_data(session, config, rows)
    session.commit()


if __name__ == '__main__':
    main()
