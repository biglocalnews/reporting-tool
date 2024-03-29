import { UsergroupAddOutlined } from "@ant-design/icons";
import { useMutation, useQuery } from "@apollo/client";
import { Alert, Button, Col, Form, Input, Modal, PageHeader, Row, Table } from "antd";
const { Search } = Input;
import { ColumnsType } from "antd/lib/table";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { messageError, messageSuccess } from "../../components/Message";
import { useTranslationWithPrefix } from "../../components/useTranslationWithPrefix";
import { AdminCreateTeam } from "../../graphql/__generated__/AdminCreateTeam";
import { AdminGetAllPrograms } from "../../graphql/__generated__/AdminGetAllPrograms";
import { AdminGetAllTeams } from "../../graphql/__generated__/AdminGetAllTeams";
import { GetUserList } from "../../graphql/__generated__/GetUserList";
import { ADMIN_CREATE_TEAM } from "../../graphql/__mutations__/AdminCreateTeam.gql";
import { ADMIN_GET_ALL_PROGRAMS } from "../../graphql/__queries__/AdminGetAllPrograms.gql";
import { ADMIN_GET_ALL_TEAMS } from "../../graphql/__queries__/AdminGetAllTeams.gql";
import { GET_USER_LIST } from "../../graphql/__queries__/GetUserList.gql";
import { CreateTeam } from "./CreateTeam";
import { EditLink } from "./EditLink";

/**
 * Data for one row in the table.
 */
type TeamRow = {
  id: string;
  name: string;
  userCount: number;
  programCount: number;
};


/**
 * Index of all teams in the application.
 */
export const TeamList = () => {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const { tp } = useTranslationWithPrefix("admin.team.index");
  const [createTeamForm] = Form.useForm();
  const [createTeam, { loading: createTeamLoading, error: createTeamError }] =
    useMutation<AdminCreateTeam>(ADMIN_CREATE_TEAM, {
      onCompleted: (data) => {
        messageSuccess(tp("createSuccess"));
        navigate(`/admin/teams/${data.createTeam.id}`);
      },
      onError: (error) => {
        messageError(error.message);
        console.error(error);
      },
    });
  const {
    error: teamsError,
    loading: teamsLoading,
    data: teamsData,
  } = useQuery<AdminGetAllTeams>(ADMIN_GET_ALL_TEAMS, {
    fetchPolicy: "network-only",
  });

  const {
    error: programsError,
    loading: programsLoading,
    data: programsData,
  } = useQuery<AdminGetAllPrograms>(ADMIN_GET_ALL_PROGRAMS, {
    fetchPolicy: "network-only",
  });

  const {
    error: usersError,
    loading: usersLoading,
    data: usersData,
  } = useQuery<GetUserList>(GET_USER_LIST, { fetchPolicy: "network-only" });

  const loading = teamsLoading || programsLoading || usersLoading;

  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);

  const tableData = useMemo(() => {
    if (loading || !usersData || !programsData || !teamsData) return [];

    const data: TeamRow[] = [];

    const userCountByTeam = usersData.users.reduce((map, user) => {
      for (const team of user.teams) {
        if (!team) {
          continue;
        }

        const count = map.get(team.id) || 0;
        map.set(team.id, count + 1);
      }
      return map;
    }, new Map());

    const programCountByTeam = programsData.programs.reduce((map, program) => {
      const count = map.get(program.team?.id) || 0;
      map.set(program.team?.id, count + 1);
      return map;
    }, new Map());

    for (const team of teamsData.teams) {
      data.push({
        id: team.id,
        name: team.name,
        userCount: userCountByTeam.get(team.id) || 0,
        programCount: programCountByTeam.get(team.id) || 0,
      });
    }

    return data;

  }, [teamsData, programsData, usersData, loading]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return tableData;
    return tableData.filter(x => x.name.toLocaleLowerCase().includes(searchTerm?.toLocaleLowerCase()));
  }, [tableData, searchTerm]);

  // Throw any errors up to the error boundary
  const error = teamsError || programsError || usersError;
  if (error) {
    throw error;
  }

  if (!teamsLoading && !(teamsData && teamsData.teams)) {
    throw new Error(tp("malformedData"));
  }

  if (!programsLoading && !(programsData && programsData.programs)) {
    throw new Error(tp("malformedData"));
  }

  if (!usersLoading && !(usersData && usersData.users)) {
    throw new Error(tp("malformedData"));
  }

  // Table columns
  const cols: ColumnsType<TeamRow> = [
    {
      title: tp("column.name"),
      dataIndex: "name",
      defaultSortOrder: "ascend",
      sorter: (a, b) => (a.name < b.name ? -1 : 1),
    },
    {
      title: tp("column.userCount"),
      dataIndex: "userCount",
      sorter: (a, b) => (a.userCount < b.userCount ? -1 : 1),
    },
    {
      title: tp("column.programCount"),
      dataIndex: "programCount",
      sorter: (a, b) => (a.programCount < b.programCount ? -1 : 1),
    },
    {
      title: "",
      key: "edit",
      render: EditLink((record) => `/admin/teams/${record.id}`),
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <PageHeader
          title={tp("title")}
          subTitle={tp("subtitle")}
          extra={[
            <Button
              icon={<UsergroupAddOutlined />}
              key="add-user"
              type="primary"
              onClick={() => setShowCreate(true)}
            >
              {tp("createNew")}
            </Button>,
            <Modal
              key={2}
              forceRender
              visible={showCreate}
              onOk={() => createTeamForm.submit()}
              confirmLoading={createTeamLoading}
              okText={tp("save")}
              onCancel={() => {
                setShowCreate(false);
                createTeamForm.resetFields();
              }}
              cancelText={tp("cancel")}
              title={tp("createTitle")}
            >
              {createTeamError && (
                <Alert
                  message={tp("createTeamError")}
                  showIcon
                  closable
                  description={createTeamError.message}
                  type="error"
                />
              )}

              <CreateTeam
                form={createTeamForm}
                onFinish={(values) =>
                  createTeam({
                    variables: { input: values },
                  })
                }
              />
            </Modal>
          ]}
        />
      </Col>
      <Col span={6} offset={18}>
        <Search placeholder={tp("searchTeams")} allowClear onSearch={(e) => setSearchTerm(e)} />

      </Col>
      <Col span={24}>
        <Table
          loading={loading}
          rowKey={(team) => team.id}
          dataSource={filteredData}
          columns={cols}
        />
      </Col>
    </Row>
  );
};
