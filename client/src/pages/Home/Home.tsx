import { useQuery } from "@apollo/client";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { useState } from "react";
import { TFunction, useTranslation } from "react-i18next";
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
  [key: string]: string | string[];
}

const getTableData = (
  queryData: AllDatasets_teams[],
  t: TFunction<"translation">
) => {
  const rowData: Array<TableData> = [];

  queryData.map((team) => {
    return team.programs.map((program) => {
      program.datasets.map((dataset) => {
        rowData.push({
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

  return rowData;
};

const Home = (): JSX.Element => {
  const { t } = useTranslation();
  const auth = useAuth();
  const userId = auth.getUserId();

  const { data, loading, error } = useQuery<GetUser, GetUserVariables>(
    GET_USER,
    {
      variables: { id: userId },
    }
  );
  const allTeams = useQuery<AllDatasets>(ALL_DATASETS, {
    skip: !auth.isAdmin(),
  });

  const [filteredData, setFilteredData] = useState<Array<TableData>>([]);

  const originalTeamData = allTeams?.data?.teams || data?.user?.teams || [];
  const rowData = getTableData(originalTeamData.slice(), t);

  // Filters datasets table by search term
  const handleTableSearchFilter = (searchText: string) => {
    const data = [...rowData];
    const filteredData = data.filter(({ team, dataset }) => {
      team = team.toLowerCase();
      dataset = dataset.toLowerCase();
      return team.includes(searchText) || dataset.includes(searchText);
    });

    setFilteredData(filteredData);
  };

  if (error) return <ErrorFallback error={error} />;

  return (
    <>
      <div
        id="home_table-search"
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "1rem",
        }}
      >
        <HomeSearchAutoComplete onSearch={handleTableSearchFilter} />
      </div>

      <HomeDatasetsListTable
        loading={loading}
        filteredData={filteredData}
        rowData={rowData}
      />
    </>
  );
};

export { Home };
