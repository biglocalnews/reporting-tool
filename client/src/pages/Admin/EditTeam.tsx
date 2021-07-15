import { useMutation } from "@apollo/client";
import {
  Alert,
  Button,
  Divider,
  Form,
  Input,
  PageHeader,
  Transfer,
} from "antd";
import { useHistory, useParams } from "react-router-dom";
import { Loading } from "../../components/Loading/Loading";
import { messageError, messageSuccess } from "../../components/Message";
import { useTranslationWithPrefix } from "../../components/useTranslationWithPrefix";
import { useQueryWithErrorHandling } from "../../graphql/hooks/useQueryWithErrorHandling";
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
  const {
    data: teamData,
    loading: loadingTeam,
    refetch: refetchTeam,
  } = useQueryWithErrorHandling<AdminGetTeam, AdminGetTeamVariables>(
    ADMIN_GET_TEAM,
    "team",
    {
      variables: {
        id: teamId,
      },
      fetchPolicy: "network-only",
    }
  );

  const {
    data: usersData,
    loading: loadingUsers,
    refetch: refetchUsers,
  } = useQueryWithErrorHandling<GetUserList>(GET_USER_LIST, "users", {
    fetchPolicy: "network-only",
  });

  const {
    data: programsData,
    loading: loadingPrograms,
    refetch: refetchPrograms,
  } = useQueryWithErrorHandling<AdminGetAllPrograms>(
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
    refresh: () => {
      refetchPrograms();
      refetchUsers();
      refetchTeam();
    },
  };
};

/**
 * UI Component for editing a team.
 */
export const EditTeam = () => {
  const { tp } = useTranslationWithPrefix("admin.team.edit");
  const { teamId } = useParams<EditTeamRouteParams>();
  const { team, allUsers, allPrograms, loading, refresh } =
    useEditTeamData(teamId);
  const [saveTeam, { loading: saveTeamLoading, error: saveTeamError }] =
    useMutation<AdminUpdateTeam, AdminUpdateTeamVariables>(ADMIN_UPDATE_TEAM, {
      onCompleted() {
        messageSuccess(tp("saveSuccess"));
        refresh();
      },
      onError() {
        messageError(tp("saveError"));
      },
    });
  const history = useHistory();
  const [form] = Form.useForm<EditTeamData>();

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
      <Form
        form={form}
        scrollToFirstError
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 14 }}
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

        <Divider>{tp("users")}</Divider>

        <Form.Item
          label={tp("usersInfo")}
          valuePropName="targetKeys"
          name="userIds"
        >
          <Transfer
            pagination
            showSearch
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

        <Divider>{tp("programs")}</Divider>

        <Form.Item
          label={tp("programsInfo")}
          valuePropName="targetKeys"
          name="programIds"
        >
          <Transfer
            pagination
            showSearch
            filterOption={(input, option) =>
              option.name.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            titles={[tp("otherPrograms"), tp("teamPrograms")]}
            dataSource={allPrograms}
            onChange={(keys) => form.setFieldsValue({ programIds: keys })}
            render={(program) => program.name}
          />
        </Form.Item>

        <Form.Item
          style={{ paddingTop: 48 }}
          wrapperCol={{ offset: 8, span: 16 }}
        >
          <Button htmlType="submit" type="primary" loading={saveTeamLoading}>
            {tp("submit")}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
