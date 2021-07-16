import { useMutation } from "@apollo/client";
import {
  Alert,
  Button,
  Col,
  Divider,
  Form,
  Input,
  PageHeader,
  Popconfirm,
  Row,
  Transfer,
} from "antd";
import { useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { Loading } from "../../components/Loading/Loading";
import { messageError, messageSuccess } from "../../components/Message";
import { useTranslationWithPrefix } from "../../components/useTranslationWithPrefix";
import { useQueryWithErrorHandling } from "../../graphql/hooks/useQueryWithErrorHandling";
import {
  AdminDeleteTeam,
  AdminDeleteTeamVariables,
} from "../../graphql/__generated__/AdminDeleteTeam";
import { AdminGetAllPrograms } from "../../graphql/__generated__/AdminGetAllPrograms";
import {
  AdminGetTeam,
  AdminGetTeamVariables,
} from "../../graphql/__generated__/AdminGetTeam";
import {
  AdminUpdateTeam,
  AdminUpdateTeamVariables,
} from "../../graphql/__generated__/AdminUpdateTeam";
import { GetUserList } from "../../graphql/__generated__/GetUserList";
import { ADMIN_DELETE_TEAM } from "../../graphql/__mutations__/AdminDeleteTeam.gql";
import { ADMIN_UPDATE_TEAM } from "../../graphql/__mutations__/AdminUpdateTeam.gql";
import { ADMIN_GET_ALL_PROGRAMS } from "../../graphql/__queries__/AdminGetAllPrograms.gql";
import { ADMIN_GET_TEAM } from "../../graphql/__queries__/AdminGetTeam.gql";
import { GET_USER_LIST } from "../../graphql/__queries__/GetUserList.gql";

/**
 * Parameters parsed from the URL.
 */
export type EditTeamRouteParams = {
  teamId: string;
};

/**
 * Form values set by the UI.
 */
export type EditTeamData = {
  id: string;
  name: string;
  userIds: string[];
  programIds: string[];
};

/**
 * Hook to return all the data required to render the team edit form.
 */
const useEditTeamData = (teamId: string) => {
  const { data: teamData, loading: loadingTeam } = useQueryWithErrorHandling<
    AdminGetTeam,
    AdminGetTeamVariables
  >(ADMIN_GET_TEAM, "team", {
    variables: {
      id: teamId,
    },
    fetchPolicy: "network-only",
  });

  const { data: usersData, loading: loadingUsers } =
    useQueryWithErrorHandling<GetUserList>(GET_USER_LIST, "users", {
      fetchPolicy: "network-only",
    });

  const { data: programsData, loading: loadingPrograms } =
    useQueryWithErrorHandling<AdminGetAllPrograms>(
      ADMIN_GET_ALL_PROGRAMS,
      "programs",
      {
        fetchPolicy: "network-only",
      }
    );

  const loading = loadingTeam || loadingUsers || loadingPrograms;

  const team: EditTeamData = {
    id: teamId,
    name: teamData?.team.name || "",
    userIds: teamData?.team.users.map((user) => user.id) || [],
    programIds: teamData?.team.programs.map((program) => program.id) || [],
  };

  return {
    team,
    loading,
    allUsers: usersData?.users.map((user) => ({ ...user, key: user.id })),
    allPrograms: programsData?.programs.map((program) => ({
      ...program,
      key: program.id,
    })),
    queries: [
      { query: ADMIN_GET_TEAM, variables: { id: teamId } },
      { query: ADMIN_GET_ALL_PROGRAMS },
      { query: GET_USER_LIST },
    ],
  };
};

/**
 * UI Component for editing a team.
 */
export const EditTeam = () => {
  const { tp, t } = useTranslationWithPrefix("admin.team.edit");
  const { teamId } = useParams<EditTeamRouteParams>();
  const { team, allUsers, allPrograms, loading, queries } =
    useEditTeamData(teamId);
  const [form] = Form.useForm<EditTeamData>();
  const [dirty, setDirty] = useState(false);
  const [saveTeam, { loading: saveTeamLoading, error: saveTeamError }] =
    useMutation<AdminUpdateTeam, AdminUpdateTeamVariables>(ADMIN_UPDATE_TEAM, {
      awaitRefetchQueries: true,
      refetchQueries: queries,
      onCompleted() {
        messageSuccess(tp("saveSuccess"));
        setDirty(false);
      },
      onError(e) {
        messageError(tp("saveError"));
        console.error(e);
      },
    });
  const history = useHistory();
  const [deleteTeam, { loading: deleteTeamLoading, error: deleteTeamError }] =
    useMutation<AdminDeleteTeam, AdminDeleteTeamVariables>(ADMIN_DELETE_TEAM, {
      onCompleted() {
        messageSuccess(tp("deleteSuccess"));
        history.push("/admin/teams");
      },
      onError(e) {
        messageError(tp("deleteFail"));
        console.error(e);
      },
    });

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="admin team-editteam_container">
      <PageHeader
        onBack={() => history.push("/admin/teams")}
        title={tp("title")}
      />

      {saveTeamError && (
        <>
          <Alert
            message={tp("saveTeamError")}
            description={saveTeamError!.message}
            type="error"
            showIcon
            closable
          />
          <br />
        </>
      )}

      {deleteTeamError && (
        <>
          <Alert
            message={tp("deleteTeamError")}
            description={deleteTeamError!.message}
            type="error"
            showIcon
            closable
          />
          <br />
        </>
      )}

      <Form
        form={form}
        onFieldsChange={() => setDirty(true)}
        scrollToFirstError
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 16 }}
        initialValues={team}
        onFinish={(values) =>
          saveTeam({
            variables: {
              input: {
                ...values,
                id: teamId,
              },
            },
          })
        }
      >
        <Row>
          <Col offset={2} span={20}>
            <Form.Item
              label={tp("name")}
              rules={[
                {
                  required: true,
                  message: tp("nameRequired"),
                },
              ]}
              name="name"
            >
              <Input aria-label={tp("name")} aria-required="true" />
            </Form.Item>

            <Divider orientation="left">{tp("users")}</Divider>

            <Form.Item
              label={tp("usersInfo")}
              valuePropName="targetKeys"
              name="userIds"
              wrapperCol={{ offset: 1, span: 22 }}
            >
              <Transfer
                pagination
                operations={[tp("add"), tp("remove")]}
                showSearch
                listStyle={{ width: 420 }}
                filterOption={(input, option) =>
                  `${option.firstName} ${option.lastName}`
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                titles={[tp("nonTeamMembers"), tp("teamMembers")]}
                dataSource={allUsers}
                onChange={(keys) => form.setFieldsValue({ userIds: keys })}
                render={(user) => `${user.firstName} ${user.lastName}`}
              />
            </Form.Item>

            <Divider orientation="left">{tp("programs")}</Divider>

            <Form.Item
              label={tp("programsInfo")}
              valuePropName="targetKeys"
              name="programIds"
              wrapperCol={{ offset: 1, span: 22 }}
            >
              <Transfer
                pagination
                operations={[tp("add"), tp("remove")]}
                showSearch
                listStyle={{ width: 420 }}
                filterOption={(input, option) =>
                  option.name.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                titles={[tp("otherPrograms"), tp("teamPrograms")]}
                dataSource={allPrograms}
                onChange={(keys) => form.setFieldsValue({ programIds: keys })}
                render={(program) =>
                  program.name + (program.team ? ` [${program.team.name}]` : "")
                }
              />
            </Form.Item>
          </Col>
        </Row>

        <Row justify="center">
          <Form.Item style={{ paddingTop: 48 }} wrapperCol={{ span: 24 }}>
            <Button
              disabled={!dirty}
              htmlType="submit"
              type="primary"
              loading={saveTeamLoading}
            >
              {tp("submit")}
            </Button>

            <Popconfirm
              title={tp("confirmDelete")}
              onConfirm={() => {
                if (dirty) {
                  messageError(tp("dirtyFormDeleteError"));
                  return;
                }

                if (form.getFieldValue("programIds")?.length) {
                  messageError(tp("deleteProgramIds"));
                  return;
                }

                if (form.getFieldValue("userIds")?.length) {
                  messageError(tp("deleteUserIds"));
                  return;
                }

                deleteTeam({ variables: { id: teamId } });
              }}
              okText={t("confirm.yes")}
              cancelText={t("confirm.no")}
              disabled={dirty}
            >
              <Button danger disabled={dirty} loading={deleteTeamLoading}>
                {tp("delete")}
              </Button>
            </Popconfirm>
          </Form.Item>
        </Row>
      </Form>
    </div>
  );
};
