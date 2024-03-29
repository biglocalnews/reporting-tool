import { AppstoreAddOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { Button, Col, Form, Input, Modal, PageHeader, Row, Table } from "antd";
const { Search } = Input;
import { ColumnsType } from "antd/lib/table";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryWithErrorHandling } from "../../graphql/hooks/useQueryWithErrorHandling";
import {
  AdminGetAllPrograms,
  AdminGetAllPrograms_programs,
} from "../../graphql/__generated__/AdminGetAllPrograms";
import { ADMIN_GET_ALL_PROGRAMS } from "../../graphql/__queries__/AdminGetAllPrograms.gql";
import { CreateProgram, CreateProgramFormValues } from "./CreateProgram";
import { EditLink } from "./EditLink";

/**
 * Render a cell in the table for categories tracked by a dataset.
 */
const CategoriesCell = (_: string, record: AdminGetAllPrograms_programs) => {
  const uniqCategories = record.targets.reduce((agg, current) => {
    agg.add(current.category.name);
    return agg;
  }, new Set<string>());
  //const categories = Array.from(uniqCategories).sort();
  return <div>{Array.from(uniqCategories).join(", ")}</div>;
};

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
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data?.programs;
    return data?.programs.filter(x => x.name.toLocaleLowerCase().includes(searchTerm?.toLocaleLowerCase()));
  }, [data?.programs, searchTerm])

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
        }
      ],
      onFilter: (
        value: boolean | string | number,
        record: AdminGetAllPrograms_programs
      ) => (value ? !record.deleted : !!record.deleted),
    },
    {
      title: "",
      key: "action",
      render: EditLink((record) => `/admin/programs/${record.id}`),
    },
  ];

  return (
    <Row className="admin program-programlist_container" gutter={[16, 16]}>
      <Col span={24}>
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
            <Modal
              key={2}
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
          ]}
        />
      </Col>
      <Col span={6} offset={18}>
        <Search placeholder={t("admin.program.index.searchDatasetGroups")} allowClear onSearch={(e) => setSearchTerm(e)} />

      </Col>
      <Col span={24}>
        <Table
          rowKey={(program) => program.id}
          loading={loading}
          dataSource={filteredData}
          columns={columns}
        />
      </Col>
    </Row>
  );
};
