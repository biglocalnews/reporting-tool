import React, { useState, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import { useQuery, ApolloQueryResult } from "@apollo/client";
import { useTranslation, TFunction } from "react-i18next";
import { DeleteOutlined, SaveOutlined } from "@ant-design/icons";
import {
  Alert,
  Form,
  Button,
  Input,
  Divider,
  List,
  Checkbox,
  Select,
  Row,
  PageHeader,
  Modal,
  message,
} from "antd";

import { ADMIN_GET_USER } from "../../__queries__/AdminGetUser.gql";
import { ADMIN_GET_ALL_TEAMS } from "../../__queries__/AdminGetAllTeams.gql";
import { ADMIN_GET_ALL_ROLES } from "../../__queries__/AdminGetAllRoles.gql";
import {
  AdminGetAllTeams,
  AdminGetAllTeams_teams,
} from "../../__generated__/AdminGetAllTeams";
import {
  AdminGetAllRoles,
  AdminGetAllRoles_roles,
} from "../../__generated__/AdminGetAllRoles";
import {
  AdminGetUser,
  AdminGetUser_user,
  AdminGetUser_user_teams,
} from "../../__generated__/AdminGetUser";
import { Loading } from "../../components/Loading/Loading";
import * as account from "../../services/account";

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
    return response.error.message;
  }

  if (!response.data) {
    return t("admin.user.noQueryData");
  }

  if (!response.data[expectedKey]) {
    return t("admin.user.queryMissingKey", { expectedKey });
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
    error: userResponse.error || teamsResponse.error || rolesResponse.error,
  };
};

/**
 * Hook for the request to save changes to user, with associated state.
 */
const useSaveUser = (id: string, t: TFunction) => {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);

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
     */
    saveUser: async (formData: account.EditUserFormData) => {
      setSaving(true);
      setSaveError(null);
      setSaving(false);

      try {
        await account.editUser(id, formData);
        message.success(t("admin.user.saveSuccess"));
      } catch (e) {
        setSaveError(e);
      }
    },
  };
};

/**
 * Hook for user deletion request and state.
 */
const useDeleteUser = (userId: string, t: TFunction) => {
  const history = useHistory();
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
     * Delete a user (with confirmation)
     */
    deleteUser: () => {
      setDeleting(true);
      setDeleteError(null);
      Modal.confirm({
        title: t("admin.user.deleteTitle"),
        content: t("admin.user.deleteInfo"),
        onOk: async () => {
          try {
            await account.deleteUser(userId);
            history.push("/admin/users");
          } catch (e) {
            setDeleteError(e);
          } finally {
            setDeleting(false);
          }
        },
        onCancel: () => setDeleting(false),
      });
    },
  };
};

/**
 * Hook for the query to restore a user, with associated state.
 */
const useRestoreUser = (userId: string, refresh: () => void, t: TFunction) => {
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
      } catch (e) {
        setRestoreError(e);
      } finally {
        setRestoring(false);
      }
    },
  };
};

/**
 * Form to edit information about a user.
 */
export const EditUser = () => {
  const { userId } = useParams<{ userId: string }>();
  const { t } = useTranslation();

  const {
    rolesResponse,
    teamsResponse,
    userResponse,
    loading,
    error,
    refresh,
  } = useAdminUserQueries(userId, t);

  const { saving, saveError, saveUser } = useSaveUser(userId, t);
  const { deleting, deleteError, deleteUser } = useDeleteUser(userId, t);
  const { restoring, restoreError, restoreUser } = useRestoreUser(
    userId,
    refresh,
    t
  );

  // TODO: update error and loading components
  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <div>An error occurred: {error}</div>;
  }

  // Get the team object given its ID.
  const getTeamById = (id: string) =>
    teamsResponse.data!.teams.find((t) => t.id === id);

  // Initial values of the form fields.
  const initialFormState: account.EditUserFormData = {
    first_name: userResponse.data!.user.firstName,
    last_name: userResponse.data!.user.lastName,
    email: userResponse.data!.user.email,
    roles: userResponse.data!.user.roles.map((r) => r.id),
    teams: userResponse.data!.user.teams.map((t) => t.id),
  };

  // Whether user has been deleted
  const inactive = !userResponse.data!.user.active;

  return (
    <div className="admin user-edituser_container">
      <PageHeader
        onBack={() => window.history.back()}
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
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 14 }}
        initialValues={initialFormState}
        onFinish={saveUser}
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
          <Input disabled={inactive} />
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
          <Input disabled={inactive} />
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
          <Input disabled={inactive} />
        </Form.Item>

        <Divider orientation="left" />

        <Form.Item name="teams" label={t("admin.user.fields.teams")}>
          <Select
            mode="multiple"
            showSearch
            disabled={inactive}
            placeholder={t("admin.user.teamSearch")}
            optionFilterProp="children"
            filterOption={(input, option) =>
              option?.children.toLowerCase().indexOf(input?.toLowerCase()) >= 0
            }
            filterSort={(a, b) =>
              a.children.toLowerCase().localeCompare(b.children.toLowerCase())
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
                <Checkbox value={role.id}>{role.description}</Checkbox>
              </Row>
            ))}
          </Checkbox.Group>
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            htmlType="submit"
            disabled={deleting || inactive}
            loading={saving}
          >
            {t("admin.user.save")}
          </Button>

          <Button
            danger
            icon={<DeleteOutlined />}
            disabled={saving || inactive}
            loading={deleting}
            onClick={deleteUser}
          >
            {t("admin.user.delete")}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
