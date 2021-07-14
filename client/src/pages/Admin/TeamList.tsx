import { useQuery } from "@apollo/client";
import { Table } from "antd";
import { ColumnsType } from "antd/lib/table";
import { useTranslationWithPrefix } from "../../components/useTranslationWithPrefix";
import {
  AdminGetAllTeams,
  AdminGetAllTeams_teams,
} from "../../graphql/__generated__/AdminGetAllTeams";
import { ADMIN_GET_ALL_TEAMS } from "../../graphql/__queries__/AdminGetAllTeams.gql";
import { EditLink } from "./EditLink";

export const TeamList = () => {
  const { tp } = useTranslationWithPrefix("admin.team.index");
  const { data, loading, error } = useQuery<AdminGetAllTeams>(
    ADMIN_GET_ALL_TEAMS,
    {
      fetchPolicy: "network-only",
    }
  );

  // Throw errors up to an error boundary for handling.
  if (error) {
    throw error;
  }

  if (!loading && !(data && data.teams)) {
    throw new Error(tp("malformedData"));
  }

  // Table columns
  const cols: ColumnsType<AdminGetAllTeams_teams> = [
    {
      title: tp("column.name"),
      dataIndex: "name",
      defaultSortOrder: "ascend",
      sorter: (a, b) => (a.name < b.name ? -1 : 1),
    },
    {
      title: "",
      key: "edit",
      render: EditLink((record) => `/admin/team/${record.id}`),
    },
  ];

  return (
    <Table
      loading={loading}
      rowKey={(team) => team.id}
      dataSource={data?.teams}
      columns={cols}
    />
  );
};
