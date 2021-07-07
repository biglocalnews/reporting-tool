import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button, Modal, Table, Form, PageHeader } from "antd";
import { ColumnsType } from "antd/lib/table";
import {
  EditOutlined,
  CheckCircleOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { GET_USER_LIST } from "../../graphql/__queries__/GetUserList.gql";
import {
  GetUserList,
  GetUserList_users,
} from "../../graphql/__generated__/GetUserList";
import { Loading } from "../../components/Loading/Loading";
import { CreateUser } from "./CreateUser";
import { CreateUserFormValues } from "../../services/account";

/**
 * Index of all users in the organization.
 */
export const UserList = () => {
  const [createUserForm] = Form.useForm<CreateUserFormValues>();
  const { t } = useTranslation();
  const [showCreateUser, setShowCreateUser] = useState(false);
  const { data, loading, error } = useQuery<GetUserList>(GET_USER_LIST, {
    fetchPolicy: "network-only",
  });

  // TODO: update error and loading components
  if (loading) {
    return <Loading />;
  }

  if (error || !data || !data.users) {
    return <div>An error occurred: {error}</div>;
  }

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

  const ActionLink = (text: string, record: GetUserList_users) => (
    <Link to={`/admin/users/${record.id}`}>
      <EditOutlined />
    </Link>
  );

  columns.push({
    title: "",
    key: "action",
    render: ActionLink,
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
        onOk={() => createUserForm.submit()}
        okText={t("admin.user.save")}
        onCancel={() => {
          setShowCreateUser(false);
          createUserForm.resetFields();
        }}
        cancelText={t("admin.user.cancel")}
        title={t("admin.user.createTitle")}
      >
        <CreateUser form={createUserForm} />
      </Modal>
      <Table
        rowKey={(user) => user.id}
        dataSource={data.users}
        columns={columns}
      />
    </div>
  );
};
