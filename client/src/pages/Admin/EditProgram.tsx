import {
  CloseCircleOutlined,
  DeleteOutlined,
  PlusCircleOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  List,
  PageHeader,
  Popconfirm,
  Row,
  Select,
  Typography,
} from "antd";
import React from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useParams } from "react-router-dom";
import { Loading } from "../../components/Loading/Loading";
import { NewStringInput } from "../../components/NewStringInput";
import { useQueryWithErrorHandling } from "../../graphql/hooks/useQueryWithErrorHandling";
import { AdminGetAllCategories } from "../../graphql/__generated__/AdminGetAllCategories";
import { AdminGetAllTeams } from "../../graphql/__generated__/AdminGetAllTeams";
import {
  AdminGetProgram,
  AdminGetProgramVariables,
  AdminGetProgram_program_targets,
} from "../../graphql/__generated__/AdminGetProgram";
import { ADMIN_GET_ALL_CATEGORIES } from "../../graphql/__queries__/AdminGetAllCategories.gql";
import { ADMIN_GET_ALL_TEAMS } from "../../graphql/__queries__/AdminGetAllTeams.gql";
import { ADMIN_GET_PROGRAM } from "../../graphql/__queries__/AdminGetProgram.gql";
import {
  CategoryTarget,
  CategoryTargetSegment,
  ProgramUpdateFormValues,
  useDeactivate,
  useRestore,
  useSave,
} from "./programHooks";

/**
 * URL parameters expected for this page.
 */
export type EditProgramRouteParams = Readonly<{
  programId: string;
}>;

/**
 * Group the targets by category in a way that's reasonable for a UI form.
 *
 * This basically means turning the GraphQL query response inside out.
 */
const getGroupedTargets = (
  targets: readonly AdminGetProgram_program_targets[]
) => {
  const groupedByCategory = new Map<string, CategoryTarget>();

  for (const target of targets) {
    const categoryId = target.categoryValue.category.id;
    if (!groupedByCategory.has(categoryId)) {
      groupedByCategory.set(categoryId, {
        categoryId,
        categoryName: target.categoryValue.category.name,
        categoryDescription: target.categoryValue.category.description,
        segments: [],
      });
    }

    const category = groupedByCategory.get(categoryId)!;
    category.segments.push({
      categoryValueId: target.categoryValue.id,
      categoryValueName: target.categoryValue.name,
      targetId: target.id,
      targetValue: target.target,
    });
  }

  // Return the categories as a list sorted by name.
  const asList = Array.from(groupedByCategory.values());
  asList.sort((a, b) => (a.categoryName < b.categoryName ? -1 : 1));

  return asList;
};

/**
 * Form to edit or delete a program.
 */
export const EditProgram = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { programId } = useParams<EditProgramRouteParams>();
  const [editForm] = Form.useForm<ProgramUpdateFormValues>();
  const save = useSave();
  const restore = useRestore();
  const deactivate = useDeactivate();

  const programResponse = useQueryWithErrorHandling<
    AdminGetProgram,
    AdminGetProgramVariables
  >(ADMIN_GET_PROGRAM, "program", {
    variables: { id: programId },
    fetchPolicy: "network-only",
  });

  const teamsResponse = useQueryWithErrorHandling<AdminGetAllTeams>(
    ADMIN_GET_ALL_TEAMS,
    "teams",
    {
      fetchPolicy: "network-only",
    }
  );

  const catsResponse = useQueryWithErrorHandling<AdminGetAllCategories>(
    ADMIN_GET_ALL_CATEGORIES,
    "categories",
    {
      fetchPolicy: "network-only",
    }
  );

  if (
    teamsResponse.loading ||
    programResponse.loading ||
    catsResponse.loading
  ) {
    return <Loading />;
  }

  // Flag to indicate whether program has been deleted
  const inactive = !!programResponse.data?.program.deleted;

  // Existing persisted state of the program
  const initialFormValues: ProgramUpdateFormValues = {
    name: programResponse.data!.program.name,
    description: programResponse.data!.program.description,
    teamId: programResponse.data!.program.team?.id,
    targets: getGroupedTargets(programResponse.data!.program.targets),
    datasets: programResponse.data!.program.datasets.slice(),
  };

  return (
    <div className="admin program-editprogram_container">
      <PageHeader
        onBack={() => history.push("/admin/programs")}
        title={t("admin.program.edit.title")}
      />

      {inactive && (
        <>
          <Alert
            message={t("admin.program.edit.form.alreadyDeletedTitle")}
            description={t("admin.program.edit.form.alreadyDeletedInfo")}
            type="warning"
            action={
              <Button
                type="primary"
                danger
                onClick={() => {
                  restore.run(programId);
                  programResponse.refetch();
                }}
              >
                {t("admin.program.edit.form.restore")}
              </Button>
            }
            showIcon
          />
          <br />
        </>
      )}

      {[
        { name: "saveError", error: save.error },
        { name: "deleteError", error: deactivate.error },
        { name: "restoreError", error: restore.error },
      ]
        .filter(({ error }) => !!error)
        .map(({ name, error }) => (
          <React.Fragment key={name}>
            <Alert
              message={t(`admin.program.edit.form.validation.${name}`)}
              description={error!.message}
              type="error"
              showIcon
              closable
            />
            <br />
          </React.Fragment>
        ))}

      <Form
        form={editForm}
        scrollToFirstError
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 14 }}
        initialValues={initialFormValues}
        onFinish={(values) => save.run(programId, values)}
      >
        <Form.Item
          rules={[
            {
              required: true,
              message: t("admin.program.edit.form.validation.nameRequired"),
            },
          ]}
          label={t("admin.program.edit.form.name")}
          name="name"
        >
          <Input
            disabled={inactive}
            aria-required="true"
            aria-label={t("admin.program.edit.form.name")}
          />
        </Form.Item>

        <Form.Item
          label={t("admin.program.edit.form.description")}
          name="description"
        >
          <Input.TextArea
            disabled={inactive}
            aria-label={t("admin.program.edit.form.description")}
          />
        </Form.Item>

        <Form.Item
          label={t("admin.program.edit.form.team")}
          rules={[
            {
              required: true,
              message: t("admin.program.edit.form.validation.teamRequired"),
            },
          ]}
          name="teamId"
        >
          <Select
            showSearch
            disabled={inactive}
            filterOption={(input, option) =>
              option?.children.toLowerCase().indexOf(input?.toLowerCase()) >= 0
            }
            filterSort={(a, b) =>
              a.children.toLowerCase().localeCompare(b.children.toLowerCase())
            }
          >
            {teamsResponse.data!.teams.map((t) => (
              <Select.Option key={t.id} value={t.id}>
                {t.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Typography.Title level={4} style={{ paddingTop: 48 }}>
          {t("admin.program.edit.targetTitle")}
        </Typography.Title>

        <Form.List name="targets">
          {(targetFields, targetOps) => (
            <>
              {targetFields.map((targetField) => (
                <React.Fragment key={targetField.key}>
                  <Row>
                    <Col offset={2} span={20}>
                      <Divider orientation="left">
                        {editForm.getFieldValue([
                          "targets",
                          targetField.name,
                          "categoryName",
                        ])}
                      </Divider>
                    </Col>
                  </Row>
                  <Row key={targetField.key}>
                    <Col span={10} offset={2}>
                      <Typography.Paragraph>
                        {editForm.getFieldValue([
                          "targets",
                          targetField.name,
                          "categoryDescription",
                        ])}
                      </Typography.Paragraph>
                      <Popconfirm
                        title={t(
                          "admin.program.edit.form.stopTrackingCategoryConfirm"
                        )}
                        onConfirm={() => targetOps.remove(targetField.name)}
                        okText={t("confirm.yes")}
                        cancelText={t("confirm.no")}
                      >
                        <Button danger disabled={inactive}>
                          {t("admin.program.edit.form.stopTrackingCategory")}
                        </Button>
                      </Popconfirm>
                    </Col>
                    <Col span={10}>
                      <Form.List
                        rules={[
                          {
                            validator: async (
                              _,
                              segments: CategoryTargetSegment[]
                            ) => {
                              if (segments.length === 0) {
                                throw new Error(
                                  t(
                                    "admin.program.edit.form.validation.needSegments"
                                  )
                                );
                              }
                              const sum = segments.reduce(
                                (total, segment) => total + segment.targetValue,
                                0
                              );
                              if (sum !== 1) {
                                throw new Error(
                                  t("admin.program.edit.form.validation.100%")
                                );
                              }
                            },
                          },
                        ]}
                        name={[targetField.name, "segments"]}
                      >
                        {(segmentFields, segmentOps, segmentMeta) => (
                          <>
                            {segmentMeta.errors && (
                              <Row>
                                <Col offset={2}>
                                  <Form.ErrorList errors={segmentMeta.errors} />
                                </Col>
                              </Row>
                            )}
                            {segmentFields.map((segmentField) => (
                              <Form.Item
                                key={segmentField.key}
                                labelCol={{ span: 12 }}
                                wrapperCol={{ span: 12 }}
                                label={editForm.getFieldValue([
                                  "targets",
                                  targetField.name,
                                  "segments",
                                  segmentField.name,
                                  "categoryValueName",
                                ])}
                              >
                                <Form.Item
                                  noStyle
                                  name={[segmentField.name, "targetValue"]}
                                >
                                  <InputNumber
                                    disabled={inactive}
                                    aria-label={editForm.getFieldValue([
                                      "targets",
                                      targetField.name,
                                      "segments",
                                      segmentField.name,
                                      "categoryValueName",
                                    ])}
                                    min={0 as number}
                                    max={1 as number}
                                    step={0.01}
                                    formatter={(value) =>
                                      typeof value == "string"
                                        ? `${Math.round(
                                            parseFloat(value) * 100
                                          )}%`
                                        : ""
                                    }
                                    parser={(value) =>
                                      value
                                        ? parseFloat(value.replace("%", "")) /
                                          100
                                        : 0
                                    }
                                  />
                                </Form.Item>
                                <Popconfirm
                                  title={t(
                                    "admin.program.edit.form.confirmStopTrackingSegment"
                                  )}
                                  onConfirm={() =>
                                    segmentOps.remove(segmentField.name)
                                  }
                                  okText={t("confirm.yes")}
                                  cancelText={t("confirm.no")}
                                >
                                  <Button
                                    disabled={inactive}
                                    danger
                                    aria-label={t(
                                      "admin.program.edit.form.stopTrackingSegment",
                                      {
                                        segment: editForm
                                          .getFieldValue([
                                            "targets",
                                            targetField.name,
                                            "segments",
                                            segmentField.name,
                                            "categoryValueName",
                                          ])
                                          .toLowerCase(),
                                      }
                                    )}
                                    icon={<CloseCircleOutlined />}
                                    type="text"
                                  />
                                </Popconfirm>
                              </Form.Item>
                            ))}
                            <Row>
                              <Col offset={5} span={16}>
                                <NewStringInput
                                  disabled={inactive}
                                  placeholder={t(
                                    "admin.program.edit.form.addNewSegment",
                                    {
                                      category: editForm.getFieldValue([
                                        "targets",
                                        targetField.name,
                                        "categoryName",
                                      ]),
                                    }
                                  )}
                                  onAdd={(newSegment) => {
                                    if (newSegment) {
                                      segmentOps.add({
                                        categoryValueName: newSegment,
                                        targetValue: 0,
                                      });
                                    }
                                  }}
                                />
                              </Col>
                            </Row>
                          </>
                        )}
                      </Form.List>
                    </Col>
                  </Row>
                </React.Fragment>
              ))}

              <Row>
                <Col offset={2} span={20}>
                  <Divider
                    orientation="left"
                    dashed
                    style={{ borderColor: "#eee" }}
                  >
                    {t("admin.program.edit.form.addNewCategory")}
                  </Divider>
                  <Select
                    disabled={inactive}
                    aria-label={t("admin.program.edit.form.addNewCategory")}
                    value={t("admin.program.edit.form.addCategoryPlaceholder")}
                    onSelect={(newId) => {
                      const newCategory = catsResponse.data!.categories.find(
                        (category) => category.id === newId
                      );
                      if (!newCategory) {
                        console.error(
                          "Invariant: selected an invalid category",
                          newId
                        );
                        return;
                      }
                      targetOps.add({
                        categoryId: newCategory.id,
                        categoryName: newCategory.name,
                        categoryDescription: newCategory.description,
                        segments: [],
                      });
                    }}
                  >
                    {catsResponse
                      .data!.categories.filter(
                        (category) =>
                          !(
                            (editForm?.getFieldValue("targets") ||
                              []) as CategoryTarget[]
                          ).find((target) => target.categoryId === category.id)
                      )
                      .map((category) => (
                        <Select.Option key={category.id} value={category.id}>
                          {category.name}
                        </Select.Option>
                      ))}
                  </Select>
                </Col>
              </Row>
            </>
          )}
        </Form.List>

        <Typography.Title level={4} style={{ paddingTop: 48 }}>
          {t("admin.program.edit.datasetTitle")}
        </Typography.Title>

        <Row>
          <Col offset={2} span={20}>
            <Form.List name="datasets">
              {(datasetFields, datasetOps) => (
                <List>
                  {datasetFields.map((datasetField) => (
                    <List.Item
                      extra={
                        <Popconfirm
                          title={t(
                            "admin.program.edit.form.confirmRemoveDataset"
                          )}
                          onConfirm={() => datasetOps.remove(datasetField.key)}
                          okText={t("confirm.yes")}
                          cancelText={t("confirm.no")}
                        >
                          <Button
                            icon={<CloseCircleOutlined />}
                            aria-label={t(
                              "admin.program.edit.form.deleteDataset"
                            )}
                            disabled={inactive}
                            danger
                            type="text"
                          />
                        </Popconfirm>
                      }
                      key={datasetField.key}
                    >
                      <List.Item.Meta
                        title={
                          <Form.Item
                            label={t("admin.program.edit.form.datasetName")}
                            wrapperCol={{ span: 24 }}
                            rules={[
                              {
                                required: true,
                                message: t(
                                  "admin.program.edit.form.validation.datasetNameRequired"
                                ),
                              },
                            ]}
                            name={[datasetField.name, "name"]}
                          >
                            <Input
                              aria-label={t(
                                "admin.program.edit.form.datasetName"
                              )}
                              aria-required="true"
                              disabled={inactive}
                            />
                          </Form.Item>
                        }
                        description={
                          <Form.Item
                            label={t(
                              "admin.program.edit.form.datasetDescription"
                            )}
                            rules={[
                              {
                                required: true,
                                message: t(
                                  "admin.program.edit.form.validation.datasetDescriptionRequired"
                                ),
                              },
                            ]}
                            wrapperCol={{ span: 24 }}
                            name={[datasetField.name, "description"]}
                          >
                            <Input.TextArea
                              aria-required="true"
                              aria-label={t(
                                "admin.program.edit.form.datasetDescription"
                              )}
                              disabled={inactive}
                            />
                          </Form.Item>
                        }
                      />
                    </List.Item>
                  ))}
                  <List.Item>
                    <Button
                      disabled={inactive}
                      aria-label={t("admin.program.edit.form.addDataset")}
                      onClick={() =>
                        datasetOps.add({ name: "", description: "" })
                      }
                      icon={<PlusCircleOutlined />}
                    >
                      {t("admin.program.edit.form.addDataset")}
                    </Button>
                  </List.Item>
                </List>
              )}
            </Form.List>
          </Col>
        </Row>

        <Row justify="center">
          <Form.Item style={{ paddingTop: 48 }} wrapperCol={{ span: 24 }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
              disabled={deactivate.inFlight || inactive}
              loading={save.inFlight}
            >
              {t("admin.program.edit.form.save")}
            </Button>

            <Popconfirm
              title={t("admin.program.edit.form.confirmDelete")}
              onConfirm={() => {
                deactivate.run(programId);
                programResponse.refetch();
              }}
              okText={t("confirm.yes")}
              cancelText={t("confirm.no")}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled={save.inFlight || inactive}
                loading={deactivate.inFlight}
              >
                {t("admin.program.edit.form.delete")}
              </Button>
            </Popconfirm>
          </Form.Item>
        </Row>
      </Form>
    </div>
  );
};
