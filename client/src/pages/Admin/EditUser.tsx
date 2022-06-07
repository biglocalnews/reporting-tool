import { DeleteOutlined, SaveOutlined } from "@ant-design/icons";
import { ApolloQueryResult, useQuery } from "@apollo/client";
import {
  Alert,
  Button,
  Checkbox,
  Divider,
  Form,
  Input,
  message,
  PageHeader,
  Popconfirm,
  Row,
  Select,
} from "antd";
import React, { useState } from "react";
import { TFunction, useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Loading } from "../../components/Loading/Loading";
import { usePrompt } from "../../components/usePrompt";
import { useUserAccountManager } from "../../components/UserAccountManagerProvider";
import { AdminGetAllRoles } from "../../graphql/__generated__/AdminGetAllRoles";
import { AdminGetAllTeams } from "../../graphql/__generated__/AdminGetAllTeams";
import { AdminGetUser } from "../../graphql/__generated__/AdminGetUser";
import { ADMIN_GET_ALL_ROLES } from "../../graphql/__queries__/AdminGetAllRoles.gql";
import { ADMIN_GET_ALL_TEAMS } from "../../graphql/__queries__/AdminGetAllTeams.gql";
import { ADMIN_GET_USER } from "../../graphql/__queries__/AdminGetUser.gql";
import { EditUserFormData } from "../../services/account";

/**
 * Check that GraphQL query response doesn't contain an error.
 *
 * Returns an error message if something bad happened.
 */
const validateResponse = <T extends Record<string, any>>(
  response: ApolloQueryResult<T | undefined>,
  expectedKey: keyof T,
  t: TFunction
) => {
  if (response.error) {
    return response.error;
  }

  if (!response.data) {
    return new Error(t("admin.user.noQueryData"));
  }

  if (!response.data[expectedKey]) {
    return new Error(t("admin.user.queryMissingKey", { expectedKey }));
  }

  return null;
};

/**
 * Hook that consolidates the queries for the edit user page.
 */
const useAdminUserQueries = (id: string, t: TFunction) => {
  const userResponse = useQuery<AdminGetUser>(ADMIN_GET_USER, {
    variables: { id },
    fetchPolicy: "network-only",
  });
  const rolesResponse = useQuery<AdminGetAllRoles>(ADMIN_GET_ALL_ROLES);
  const teamsResponse = useQuery<AdminGetAllTeams>(ADMIN_GET_ALL_TEAMS, {
    fetchPolicy: "network-only",
  });

  const userError = validateResponse(userResponse, "user", t);
  const teamsError = validateResponse(teamsResponse, "teams", t);
  const rolesError = validateResponse(rolesResponse, "roles", t);

  return {
    /**
     * Apollo objects from the user query.
     */
    userResponse,
    /**
     * Apollo objects from the teams query.
     */
    teamsResponse,
    /**
     * Apollo objects from the roles query.
     */
    rolesResponse,
    /**
     * Re-run all the admin queries.
     */
    refresh: () => {
      userResponse.refetch();
      teamsResponse.refetch();
      rolesResponse.refetch();
    },
    /**
     * Flag indicating that any of the queries are still in progress.
     */
    loading:
      userResponse.loading || teamsResponse.loading || rolesResponse.loading,
    /**
     * Container for any error that occurred while running queries.
     */
    error: userError || teamsError || rolesError,
  };
};

/**
 * Hook for the request to save changes to user, with associated state.
 */
const useSaveUser = (id: string, t: TFunction) => {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);
  const account = useUserAccountManager();

  return {
    /**
     * Flag indicating whether save request is in flight.
     */
    saving,
    /**
     * Error that occurred while saving, if any.
     */
    saveError,
    /**
     * Save user data to server.
     *
     * Returns boolean indicating whether save succeeded.
     */
    saveUser: async (initialFormState: EditUserFormData, formData: EditUserFormData) => {
      setSaving(true);
      setSaveError(null);
      setSaving(false);

      try {
        if (initialFormState.email === formData.email) {
          const { email, ...restOfTheProps } = formData;
          email;//Keep linter happy by using it lol
          await account.editUser(id, restOfTheProps);
        } else {
          await account.editUser(id, formData);
        }

        message.success(t("admin.user.saveSuccess"));
        return true;
      } catch (e: unknown) {
        if (e instanceof Error) setSaveError(e);
        return false;
      }
    },
  };
};

/**
 * Hook for user deletion request and state.
 */
const useDeleteUser = (userId: string, refresh: () => void) => {
  const account = useUserAccountManager();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<Error | null>(null);

  return {
    /**
     * Indicate whether a delete is in progress.
     */
    deleting,
    /**
     * Container for any error that occurred while deleting.
     */
    deleteError,
    /**
     * Delete a user
     */
    deleteUser: async () => {
      setDeleting(true);
      setDeleteError(null);
      try {
        await account.deleteUser(userId);
        refresh();
      } catch (e: unknown) {
        if (e instanceof Error) return setDeleteError(e);
      } finally {
        setDeleting(false);
      }
    },
  };
};

/**
 * Hook for the query to restore a user, with associated state.
 */
const useRestoreUser = (userId: string, refresh: () => void) => {
  const account = useUserAccountManager();
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<Error | null>(null);

  return {
    /**
     * Flag indicating whether restore operation is in progress.
     */
    restoring,
    /**
     * Error that occurred while restoring user, if any.
     */
    restoreError,
    /**
     * Run the query to restore this user.
     */
    restoreUser: async () => {
      setRestoring(true);
      setRestoreError(null);
      try {
        await account.restoreUser(userId);
        refresh();
      } catch (e: unknown) {
        if (e instanceof Error) return setRestoreError(e);
      } finally {
        setRestoring(false);
      }
    },
  };
};

/**
 * Form to edit information about a user.
 */
export const EditUser = (): JSX.Element => {
  const [dirty, setDirty] = useState(false);
  const { userId } = useParams() as { userId: string };

  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    rolesResponse,
    teamsResponse,
    userResponse,
    loading,
    error,
    refresh,
  } = useAdminUserQueries(userId, t);

  const [teamSelectorOpen, setTeamSelectorOpen] = useState(false);
  const { saving, saveError, saveUser } = useSaveUser(userId, t);
  const { deleting, deleteError, deleteUser } = useDeleteUser(userId, refresh);
  const { restoreError, restoreUser } = useRestoreUser(userId, refresh);

  usePrompt(t("confirmLeavePage"), dirty);

  if (!userId) return <p>bad route</p>;

  if (loading) {
    return <Loading />;
  }

  if (error) {
    throw error;
  }

  // Initial values of the form fields.
  const initialFormState: EditUserFormData = {
    first_name: userResponse.data!.user.firstName,
    last_name: userResponse.data!.user.lastName,
    username: userResponse.data!.user.username,
    email: userResponse.data!.user.email,
    roles: userResponse.data!.user.roles.map((r) => r.id),
    teams: userResponse.data!.user.teams.map((t) => t.id),
  };

  // Whether user has been deleted
  const inactive = !userResponse.data!.user.active;

  return (
    <div className="admin user-edituser_container">

      <PageHeader
        onBack={() => navigate("/admin/users")}
        title={t("admin.user.title")}
      />

      {inactive && (
        <>
          <Alert
            message={t("admin.user.alreadyDeletedTitle")}
            description={t("admin.user.alreadyDeletedInfo")}
            type="warning"
            action={
              <Button type="primary" danger onClick={restoreUser}>
                {t("admin.user.restore")}
              </Button>
            }
            showIcon
          />
          <br />
        </>
      )}

      {[
        { name: "deleteError", error: deleteError },
        { name: "saveError", error: saveError },
        { name: "restoreError", error: restoreError },
      ]
        .filter((e) => !!e.error)
        .map(({ name, error }) => (
          <React.Fragment key={name}>
            <Alert
              message={t(`admin.user.validation.${name}`)}
              description={error!.message}
              type="error"
              showIcon
              closable
            />
            <br />
          </React.Fragment>
        ))}

      <Form
        scrollToFirstError
        onFieldsChange={() => setDirty(true)}
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 14 }}
        initialValues={initialFormState}
        onFinish={async (values) => {
          if (await saveUser(initialFormState, values)) {
            setDirty(false);
          }
        }}
      >
        <Form.Item
          rules={[
            {
              required: true,
              message: t("admin.user.validation.firstNameRequired"),
            },
          ]}
          label={t("admin.user.fields.firstName")}
          name="first_name"
        >
          <Input
            aria-label={t("admin.user.fields.firstName")}
            aria-required="true"
            disabled={inactive}
          />
        </Form.Item>

        <Form.Item
          rules={[
            {
              required: true,
              message: t("admin.user.validation.lastNameRequired"),
            },
          ]}
          label={t("admin.user.fields.lastName")}
          name="last_name"
        >
          <Input
            aria-label={t("admin.user.fields.lastName")}
            aria-required="true"
            disabled={inactive}
          />
        </Form.Item>
        <Form.Item
          name="username"
          label={t("admin.user.fields.username")}
          rules={[
            {
              required: true,
              message: t("admin.user.validation.usernameRequired"),
            },
          ]}
        >
          <Input
            aria-label={t("admin.user.fields.username")}
            aria-required="true"
            disabled={inactive}
          />
        </Form.Item>
        <Form.Item
          name="email"

          label={t("admin.user.fields.email")}
          rules={[
            { type: "email", message: t("admin.user.validation.email") },
            {
              required: true,
              message: t("admin.user.validation.emailRequired"),
            },
          ]}
        >
          <Input
            aria-label={t("admin.user.fields.email")}
            aria-required="true"
            disabled={inactive}
          />
        </Form.Item>

        <Divider orientation="left" />

        <Form.Item name="teams" label={t("admin.user.fields.teams")}>
          <Select<string, { value: string; children: string }>
            mode="multiple"
            showSearch
            disabled={inactive}
            aria-expanded={teamSelectorOpen ? "true" : "false"}
            onFocus={() => setTeamSelectorOpen(true)}
            onBlur={() => setTeamSelectorOpen(false)}
            placeholder={t("admin.user.teamSearch")}
            optionFilterProp="children"
            filterOption={(input, option) =>
              option!.children.toLowerCase().indexOf(input?.toLowerCase()) >= 0
            }
            filterSort={(a, b) =>
              a!.children.toLowerCase().localeCompare(b!.children.toLowerCase())
            }
          >
            {teamsResponse.data!.teams.map((t) => (
              <Select.Option value={t.id} key={t.id}>
                {t.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Divider orientation="left" />

        <Form.Item name="roles" label={t("admin.user.fields.roles")}>
          <Checkbox.Group disabled={inactive}>
            {rolesResponse.data!.roles.map((role) => (
              <Row key={role.id}>
                <Checkbox value={role.id} aria-label={role.description}>
                  {role.description}
                </Checkbox>
              </Row>
            ))}
          </Checkbox.Group>
        </Form.Item>

        <Row justify="center">
          <Form.Item wrapperCol={{ span: 24 }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
              disabled={deleting || inactive || !dirty}
              loading={saving}
            >
              {t("admin.user.save")}
            </Button>

            <Popconfirm
              title={t("admin.user.deleteInfo")}
              onConfirm={deleteUser}
              disabled={saving || dirty || inactive}
              okText={t("confirm.yes")}
              cancelText={t("confirm.no")}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled={saving || inactive || dirty}
                loading={deleting}
              >
                {t("admin.user.delete")}
              </Button>
            </Popconfirm>
          </Form.Item>
        </Row>
      </Form>
    </div>
  );
};
