import { useQuery } from "@apollo/client";
import { Alert, Button } from "antd";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { useEffect, useState } from "react";
import { TFunction, useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom";
import { useAuth } from "../../components/AuthProvider";
import { ErrorFallback } from "../../components/Error/ErrorFallback";
import {
  AllDatasets,
  AllDatasets_teams,
} from "../../graphql/__generated__/AllDatasets";
import { GetUser, GetUserVariables } from "../../graphql/__generated__/getUser";
import { ALL_DATASETS } from "../../graphql/__queries__/AllDatasets.gql";
import { GET_USER } from "../../graphql/__queries__/GetUser.gql";
import { HomeDatasetsListTable } from "./HomeDatasetsListTable";
import { HomeSearchAutoComplete } from "./HomeSearchAutoComplete";

dayjs.extend(localizedFormat);

export interface TableData {
  id: string;
  team: string;
  dataset: string;
  lastUpdated: string;
  tags: Array<string>;
  [key: string]: string | Array<string>;
}

const getTableData = (
  queryData: Array<AllDatasets_teams>,
  t: TFunction<"translation">
) => {
  const rowTableData: Array<TableData> = [];

  queryData.map((team) => {
    return team.programs.map((program) => {
      program.datasets.map((dataset) => {
        rowTableData.push({
          id: dataset.id,
          team: program.name,
          dataset: dataset.name,
          lastUpdated: dataset.lastUpdated
            ? dayjs(dataset.lastUpdated).format("ll")
            : t("noDataAvailable"),
          tags: dataset.tags.map((tag) => {
            return tag.name;
          }),
        });
      });
    });
  });

  return rowTableData;
};

const Home = (): JSX.Element => {
  const { t } = useTranslation();
  const auth = useAuth();
  const userId = auth.getUserId();

  const history = useHistory();

  const { data, loading, error } = useQuery<GetUser, GetUserVariables>(
    GET_USER,
    {
      variables: { id: userId },
    }
  );
  const allTeams = useQuery<AllDatasets>(ALL_DATASETS, {
    skip: !auth.isAdmin(),
  });

  const originalTeamData = allTeams?.data?.teams || data?.user?.teams || [];
  const allTableData = getTableData(originalTeamData.slice(), t);
  const [filteredData, setFilteredData] =
    useState<Array<TableData>>(allTableData);

  // Filters datasets table by search term
  const handleTableSearchFilteredData = (searchText: string) => {
    const data = [...allTableData];
    const filteredData = data.filter(({ team, dataset }) => {
      team = team.toLowerCase();
      dataset = dataset.toLowerCase();
      return (
        team.includes(searchText.toLowerCase()) ||
        dataset.includes(searchText.toLowerCase())
      );
    });

    setFilteredData(filteredData);
  };

  // Searches table for team name if selected from user sidebar
  const { search } = useLocation();
  const teamNameFilter = new URLSearchParams(search).get("team");
  useEffect(() => {
    if (teamNameFilter) {
      handleTableSearchFilteredData(teamNameFilter);
    }
  }, [teamNameFilter]);

  if (error) return <ErrorFallback error={error} />;

  return (
    <>
      {teamNameFilter ? (
        <Alert
          style={{ margin: "1rem 0rem" }}
          message={`${t("user.homePage.showingDatasetsFor", {
            term: "team",
          })} ${teamNameFilter.toUpperCase()}`}
          type="info"
          action={
            <Button
              style={{ margin: ".5rem 0rem" }}
              size="small"
              type="primary"
              onClick={() => history.push("/")}
            >
              {t("user.homePage.showAllMy", {
                term: "Teams",
              })}
            </Button>
          }
        />
      ) : (
        <div
          id="home_table-search"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "1rem",
          }}
        >
          <HomeSearchAutoComplete onSearch={handleTableSearchFilteredData} />
        </div>
      )}

      <HomeDatasetsListTable
        loading={loading}
        filteredData={filteredData}
        rowData={allTableData}
        teamNameFilterText={teamNameFilter}
      />
    </>
  );
};

export { Home };
