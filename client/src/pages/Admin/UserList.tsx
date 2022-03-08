import { CheckCircleOutlined, UserAddOutlined } from "@ant-design/icons";
import { useQuery } from "@apollo/client";
import { Button, message, Modal, PageHeader, Table, Tag } from "antd";
import { ColumnsType } from "antd/lib/table";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useUserAccountManager } from "../../components/UserAccountManagerProvider";
import {
  GetUserList,
  GetUserList_users,
  GetUserList_users_roles,
} from "../../graphql/__generated__/GetUserList";
import { GET_USER_LIST } from "../../graphql/__queries__/GetUserList.gql";
import { CreateUserFormValues } from "../../services/account";
import { CreateUser } from "./CreateUser";
import { EditLink } from "./EditLink";


/**
 * Index of all users in the organization.
 */
export const UserList = () => {
  const { t } = useTranslation();
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [userDetails, setUserDetails] = useState<CreateUserFormValues | undefined>(undefined);
  const navigate = useNavigate();
  const account = useUserAccountManager();
  const { data, loading, error } = useQuery<GetUserList>(GET_USER_LIST, {
    fetchPolicy: "network-only",
  });

  if (error) {
    throw error;
  }

  if (!loading && !(data && data.users)) {
    throw new Error(t("admin.user.malformedData"));
  }

  /**
   * Create a new user and handle success / error conditions.
   */
  const saveNewUser = async (values: CreateUserFormValues) => {
    try {
      const id = await account.createUser(values);
      try {
        await account.requestVerifyUser(values.email);
      } catch (e: unknown) {
        if (e instanceof Error) return message.warn(e.message);
      }
      navigate(`/admin/users/${id}`);
    } catch (e: unknown) {
      if (e instanceof Error) return message.error(e.message);
    }
  };


  const columns: ColumnsType<GetUserList_users> = (
    ["email", "firstName", "lastName"] as Array<keyof GetUserList_users>
  ).map((fieldName) => ({
    title: t(`admin.userList.columnTitle.${fieldName}`),
    dataIndex: fieldName,
    defaultSortOrder: "ascend",
    sorter: (a, b) => (a[fieldName] < b[fieldName] ? -1 : 1),
  }));

  const Active = (active: boolean) => (active ? <CheckCircleOutlined /> : null);

  columns.push({
    title: t(`admin.userList.columnTitle.roles`),
    dataIndex: "roles",
    render: (roles: GetUserList_users_roles[]) => roles.map(role => <Tag key={role.name}>{role.name}</Tag>)
  })

  columns.push({
    title: t(`admin.userList.columnTitle.active`),
    dataIndex: "active",
    defaultFilteredValue: ["true"],
    filters: [
      {
        text: "Active",
        value: "true",
      },
      {
        text: "Inactive",
        value: "false",
      },
    ],
    onFilter: (value: boolean | number | string, record: GetUserList_users) =>
      `${record.active}` === value,
    render: Active,
  });

  columns.push({
    title: "",
    key: "action",
    render: EditLink((record) => `/admin/users/${record.id}`),
  });

  return (
    <div className="admin user-userlist_container">
      <PageHeader
        title={t("admin.user.userListTitle")}
        subTitle={t("admin.user.userListSubTitle")}
        extra={[
          <Button
            icon={<UserAddOutlined />}
            key="add-user"
            type="primary"
            onClick={() => setShowCreateUser(true)}
          >
            {t("admin.user.createNew")}
          </Button>,
        ]}
      />
      <Modal
        forceRender
        visible={showCreateUser}
        onOk={() => { userDetails && saveNewUser(userDetails).then(() => { setShowCreateUser(false); setUserDetails(undefined); }) }}
        okButtonProps={userDetails ? undefined : { disabled: true }}
        okText={t("admin.user.save")}
        onCancel={() => {
          setShowCreateUser(false);
          setUserDetails(undefined);
        }}
        cancelText={t("admin.user.cancel")}
        title={t("admin.user.createTitle")}
      >
        <CreateUser setUserDetails={setUserDetails} />
      </Modal>
      <Table
        loading={loading}
        rowKey={(user) => user.id}
        dataSource={data?.users}
        columns={columns}
      />
    </div>
  );
};
