import { InfoCircleOutlined, DownloadOutlined } from "@ant-design/icons";
import { useLazyQuery, useQuery } from "@apollo/client";
import { Button, message, Table, Tag } from "antd";
import { ColumnsType } from "antd/lib/table";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { useEffect, useState } from "react";
import { TFunction, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "../../components/AuthProvider";
import { ErrorFallback } from "../../components/Error/ErrorFallback";
import { Loading } from "../../components/Loading/Loading";
import {
  AllDatasets,
  AllDatasets_teams
} from "../../graphql/__generated__/AllDatasets";
import { GetDataset } from "../../graphql/__generated__/GetDataset";
import { GetUser, GetUserVariables } from "../../graphql/__generated__/getUser";
import { ALL_DATASETS } from "../../graphql/__queries__/AllDatasets.gql";
import { GET_DATASET } from "../../graphql/__queries__/GetDataset.gql";
import { GET_USER } from "../../graphql/__queries__/GetUser.gql";
import { exportCSVTwo, mungedFilteredData } from "../DatasetDetails/PublishedRecordSet";
import { HomeSearchAutoComplete } from "./DatasetsSearchAutoComplete";

dayjs.extend(localizedFormat);

export interface TableData {
  id: string;
  importedId: number | null;
  team: string;
  dataset: string;
  lastUpdated: string;
  tags: string[];
  modified: string;
}



const getTableData = (
  queryData: AllDatasets_teams[],
  t: TFunction<"translation">
) => {
  const rowData: Array<TableData> = [];

  queryData.map((team) => {
    return team.programs
      .filter(x => !x.deleted)
      .map((program) => {
        program.datasets
          .filter(x => !x.deleted)
          .map((dataset) => {
            rowData.push({
              id: dataset.id,
              importedId: program.importedId,
              team: program.name,
              dataset: dataset.name,
              modified: dataset.lastUpdated ? dataset.lastUpdated : dayjs(0),
              lastUpdated: dataset.lastUpdated
                ? dayjs(dataset.lastUpdated).format("ll")
                : t("noDataAvailable"),
              tags: program.tags
                .map(x => x.name)
                .concat(
                  Array.from(
                    new Set(
                      program.tags
                        .filter(x => x.tagType !== "unassigned")
                        .map(x => x.tagType)
                    )
                  )
                ),
            });
          });
      });
  });

  return rowData.sort((a, b) => dayjs(b.modified).unix() - dayjs(a.modified).unix());
};

export const Datasets = (): JSX.Element => {
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

  const [getDataset, { error: downloadError, data: downloadedDataset }] = useLazyQuery<GetDataset>(GET_DATASET);

  useEffect(() => {
    const prss = downloadedDataset?.dataset.publishedRecordSets;
    if (!prss) return;
    exportCSVTwo(mungedFilteredData(prss.flat(), false, downloadedDataset?.dataset), undefined);
  }, [downloadedDataset]);

  useEffect(() => {
    downloadError && message.error(downloadError);
  }, [downloadError]);

  const [filteredData, setFilteredData] = useState<Array<TableData>>([]);

  const originalTeamData = allTeams?.data?.teams || data?.user?.teams || [];
  const rowData = getTableData(originalTeamData.slice(), t);

  // Filters datasets table by search term
  const handleTableSearchFilter = (searchText: string) => {
    const data = [...rowData];
    const filteredData = data.filter(
      ({ team, dataset, tags }) =>
        [tags.join(" "), team, dataset]
          .join(" ")
          .toLocaleLowerCase()
          .includes(searchText.toLocaleLowerCase())
    );

    setFilteredData(filteredData);
  };

  if (error) return <ErrorFallback error={error} />;

  const downloadColumn: ColumnsType<TableData> = [{
    dataIndex: "id",
    width: 50,
    align: "center",
    render: function btn(datasetId: string) {
      return (
        <Button onClick={() => getDataset({
          variables: { id: datasetId },
        })} type="primary" shape="circle" icon={<DownloadOutlined />} />
      )
    },
  }]

  const columns: ColumnsType<TableData> = [
    {
      title: "Team",
      dataIndex: "team",
      key: "team",
      sortDirections: ["ascend", "descend"],
      sorter: (a, b) => a.team.localeCompare(b.team),
    },
    {
      title: "Dataset",
      dataIndex: "dataset",
      key: "dataset",
      sortDirections: ["ascend", "descend"],
      sorter: (a, b) => a.dataset.localeCompare(b.dataset),
    },
    {
      title: "Last Updated",
      dataIndex: "lastUpdated",
      sortDirections: ["ascend", "descend"],
      sorter: (a, b) => dayjs(a.lastUpdated).unix() - dayjs(b.lastUpdated).unix()
    },
    {
      title: "Tags",
      key: "tags",
      dataIndex: "tags",
      width: 250,
      render: (tags: string[]) => {
        return tags.map((tag: string) => {
          const color = "blue";
          return (
            // TODO: Create component to link tags to datasets with the same tags
            <Tag color={color} key={tag}>
              {tag}
            </Tag>
          );
        });
      },
    },
    {
      dataIndex: "id",
      width: 50,
      align: "center",
      render: function btn(datasetId: string) {
        return (
          <Link
            to={{
              pathname: `/dataset/${datasetId}/details`,
            }}
          >
            <Button icon={<InfoCircleOutlined />}>View Details</Button>
          </Link>

        )
      }
    },
    ...downloadColumn
  ];

  return (
    <>
      {loading || allTeams.loading ? (
        <Loading tip={allTeams.loading ? "Loading all datasets..." : ""} />
      ) : (
        <div>
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
          <Table
            dataSource={filteredData.length > 0 ? filteredData : rowData}
            columns={columns}
            rowKey={(dataset) => dataset.id}
            footer={() =>
              filteredData.length > 0
                ? `Showing ${filteredData.length} of ${rowData.length} results`
                : `Showing ${rowData.length} of ${rowData.length} results`
            }
          />
        </div>
      )}
    </>
  );
};
