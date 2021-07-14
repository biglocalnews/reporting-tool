import {
  AppstoreAddOutlined,
  CheckCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { Button, Form, Modal, PageHeader, Table } from "antd";
import { ColumnsType } from "antd/lib/table";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useQueryWithErrorHandling } from "../../graphql/hooks/useQueryWithErrorHandling";
import {
  AdminGetAllPrograms,
  AdminGetAllPrograms_programs,
} from "../../graphql/__generated__/AdminGetAllPrograms";
import { ADMIN_GET_ALL_PROGRAMS } from "../../graphql/__queries__/AdminGetAllPrograms.gql";
import { CreateProgram, CreateProgramFormValues } from "./CreateProgram";

/**
 * Render a cell in the table for categories tracked by a dataset.
 */
const CategoriesCell = (_: string, record: AdminGetAllPrograms_programs) => {
  const uniqCategories = record.targets.reduce((agg, current) => {
    agg.add(current.categoryValue.category.name);
    return agg;
  }, new Set());
  const categories = Array.from(uniqCategories).sort();
  return <div>{categories.join(", ")}</div>;
};

/**
 * Render a cell to display action buttons for the program row.
 */
const ActionCell = (_: string, record: AdminGetAllPrograms_programs) => (
  <Link to={`/admin/programs/${record.id}`}>
    <EditOutlined />
  </Link>
);

/**
 * Index of all programs for the admin to manage.
 */
export const ProgramList = () => {
  const { t } = useTranslation();
  const { data, loading } = useQueryWithErrorHandling<AdminGetAllPrograms>(
    ADMIN_GET_ALL_PROGRAMS,
    "programs",
    {
      fetchPolicy: "network-only",
    }
  );
  const [newProgramForm] = Form.useForm<CreateProgramFormValues>();
  const [showCreateProgram, setShowCreateProgram] = useState(false);

  const Active = (_: string, record: AdminGetAllPrograms_programs) =>
    !record.deleted ? <CheckCircleOutlined /> : null;

  // Spec for table columns
  const columns: ColumnsType<AdminGetAllPrograms_programs> = [
    {
      title: t("admin.program.index.columnTitle.name"),
      dataIndex: "name",
      defaultSortOrder: "ascend",
      sorter: (a, b) => (a.name < b.name ? -1 : 1),
    },
    {
      title: t("admin.program.index.columnTitle.categories"),
      key: "categories",
      render: CategoriesCell,
    },
    {
      title: t("admin.program.index.columnTitle.active"),
      key: "active",
      render: Active,
      defaultFilteredValue: ["true"],
      filters: [
        {
          text: t("admin.program.index.columnTitle.activeFilter"),
          value: true,
        },
        {
          text: t("admin.program.index.columnTitle.inactiveFilter"),
          value: false,
        },
      ],
      onFilter: (
        value: boolean | string | number,
        record: AdminGetAllPrograms_programs
      ) => (value ? !record.deleted : !!record.deleted),
    },
    {
      title: "",
      key: "action",
      render: ActionCell,
    },
  ];

  return (
    <div className="admin program-programlist_container">
      <Modal
        forceRender
        visible={showCreateProgram}
        onOk={() => newProgramForm.submit()}
        okText={t("admin.program.create.save")}
        onCancel={() => {
          setShowCreateProgram(false);
          newProgramForm.resetFields();
        }}
        cancelText={t("admin.program.create.cancel")}
        title={t("admin.program.create.title")}
      >
        <CreateProgram form={newProgramForm} />
      </Modal>
      <PageHeader
        title={t("admin.program.index.title")}
        subTitle={t("admin.program.index.subtitle")}
        extra={[
          <Button
            type="primary"
            key="add-program"
            onClick={() => setShowCreateProgram(true)}
            icon={<AppstoreAddOutlined />}
          >
            {t("admin.program.index.add")}
          </Button>,
        ]}
      />
      <Table
        rowKey={(program) => program.id}
        loading={loading}
        dataSource={loading ? [] : data!.programs!}
        columns={columns}
      />
    </div>
  );
};
