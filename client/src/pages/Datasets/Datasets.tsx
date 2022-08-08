import { InfoCircleOutlined } from "@ant-design/icons";
import { useQuery } from "@apollo/client";
import { Button, Table, Tag } from "antd";
import { ColumnsType } from "antd/lib/table";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { useState } from "react";
import { TFunction, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "../../components/AuthProvider";
import { ErrorFallback } from "../../components/Error/ErrorFallback";
import { Loading } from "../../components/Loading/Loading";
import {
  AllDatasets,
  AllDatasets_teams
} from "../../graphql/__generated__/AllDatasets";
import { GetUser, GetUserVariables } from "../../graphql/__generated__/getUser";
import { ALL_DATASETS } from "../../graphql/__queries__/AllDatasets.gql";
import { GET_USER } from "../../graphql/__queries__/GetUser.gql";
import { HomeSearchAutoComplete } from "./DatasetsSearchAutoComplete";
/*import {
  GetDataset
} from "../../graphql/__generated__/GetDataset";
import { GET_DATASET } from "../../graphql/__queries__/GetDataset.gql";*/

dayjs.extend(localizedFormat);

export interface TableData {
  id: string;
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

/*const arrayToCsv = (data: [string[]]) => {
  return data.map(row =>
    row
      .map(String)  // convert every value to String
      .map(v => v.replaceAll('"', '""'))  // escape double colons
      .map(v => `"${v}"`)  // quote it
      .join(',')  // comma-separated
  ).join('\r\n');  // rows starting on new lines
}

const downloadBlob = (content: string, filename: string, contentType: string) => {
  // Create a blob
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);

  // Create a link to download it
  const pom = document.createElement('a');
  pom.href = url;
  pom.setAttribute('download', filename);
  pom.click();
}

function csvIse(objectKey: string, obj: object, csv: Record<string, string>): Record<string, string> {
  if (!obj) return csv;
  Object
    .entries(obj)
    .forEach((kv) => {

      let key = objectKey ? objectKey + "_" + kv[0] : kv[0];

      if ((kv[0] === "category" && objectKey.indexOf("targets") === -1) || kv[0] === "attribute" || kv[0] === "personType") {
        return csv;
      }
      if (kv[0] === "segmentedRecord" || kv[0] === "entries" || kv[0] === "record") {
        key = objectKey;
      }


      if (
        typeof (kv[0]) === "string" &&
        (typeof (kv[1]) === "string" || typeof (kv[1]) === "number" || typeof (kv[1]) === "boolean")
      ) {
        csv[key] = kv[1].toString();
      }

      if (typeof (kv[0]) === "string" && typeof (kv[1]) === "object") {
        csvIse(key, kv[1], csv);
      }

    }, {} as Record<string, string>);
  return csv;
}*/




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

  /*const [getDataset, { loading: downloadingDataset, error: downloadError, data: downloadedDataset }] = useLazyQuery<GetDataset>(GET_DATASET);

  useEffect(() => {
    const prss = downloadedDataset?.dataset.publishedRecordSets;

    if (!prss) return;

    const csvs = prss.
      reduce((csv, prs) => {

        const csvRecord = csvIse("", prs.document, {} as Record<string, string>);
        Object.entries(csvRecord).map(([k, v]) => k in csv ? csv[k].push(v) : csv[k] = [v]);
        return csv;

      }, {} as Record<string, string[]>);

    downloadBlob(
      arrayToCsv([Object.keys(csvs)]),
      `${downloadedDataset?.dataset.name}_${new Date(downloadedDataset?.dataset.lastUpdated).toLocaleString(navigator.language, { day: "2-digit", month: "short", year: "numeric" } as Intl.DateTimeFormatOptions)}-${new Date(prss[0].end).toLocaleString(navigator.language, { day: "2-digit", month: "short", year: "numeric" } as Intl.DateTimeFormatOptions)}.csv`,
      "text/csv");
  }, [downloadedDataset]);

  useEffect(() => {
    downloadError && message.error(downloadError);
  }, [downloadError]);*/

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

  /*const downloadColumn = {
    dataIndex: "id",
    width: 50,
    align: "center",
    render: function btn(datasetId: string) {
      return (
        <Button onClick={() => getDataset({
          variables: { id: datasetId },
        })} type="primary" shape="circle" icon={!downloadingDataset ? <DownloadOutlined /> : <InfoCircleOutlined />} />
      )
    },
  }*/

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
