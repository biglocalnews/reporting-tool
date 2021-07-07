import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useHistory } from "react-router-dom";
import { useApolloClient, ApolloClient, FetchResult } from "@apollo/client";

import {
  PlusCircleOutlined,
  CloseCircleOutlined,
  SaveOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  Alert,
  List,
  Space,
  Col,
  Row,
  Typography,
  Select,
  Divider,
  PageHeader,
  Form,
  Input,
  InputNumber,
  Button,
  Popconfirm,
  message,
} from "antd";

import { useQueryWithErrorHandling } from "../../graphql/hooks/useQueryWithErrorHandling";

import { Loading } from "../../components/Loading/Loading";
import {
  AdminGetProgram,
  AdminGetProgram_program_targets,
  AdminGetProgramVariables,
} from "../../graphql/__generated__/AdminGetProgram";
import { ADMIN_GET_PROGRAM } from "../../graphql/__queries__/AdminGetProgram.gql";
import {
  AdminGetAllTeams,
  AdminGetAllTeams_teams,
} from "../../graphql/__generated__/AdminGetAllTeams";
import { ADMIN_GET_ALL_TEAMS } from "../../graphql/__queries__/AdminGetAllTeams.gql";

import { AdminGetAllCategories } from "../../graphql/__generated__/AdminGetAllCategories";
import { ADMIN_GET_ALL_CATEGORIES } from "../../graphql/__queries__/AdminGetAllCategories.gql";
import { ADMIN_UPDATE_PROGRAM } from "../../graphql/__mutations__/AdminUpdateProgram.gql";

/**
 * URL parameters expected for this page.
 */
export type EditProgramRouteParams = Readonly<{
  programId: string;
}>;

/**
 * Represent a single target in a category, like  "non-binary" in Gender.
 */
export type CategoryTargetSegment = Readonly<{
  categoryValueId: string;
  categoryValueName: string;
  targetId: string;
  targetValue: number;
}>;

/**
 * Represent a single category such as Gender.
 */
export type CategoryTarget = Readonly<{
  categoryId: string;
  categoryName: string;
  categoryDescription: string;
  segments: CategoryTargetSegment[];
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
 * Props for the NewStringInput component.
 */
export type NewStringInputProps = {
  onAdd: (value: string, e: React.MouseEvent | React.KeyboardEvent) => void;
  icon?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
};

/**
 * Text input with a button to submit a new string and then clear the input.
 */
export const NewStringInput = (props: NewStringInputProps) => {
  const [value, setValue] = useState("");
  const icon = props.icon || <PlusCircleOutlined />;

  const submit = (e: React.MouseEvent | React.KeyboardEvent) => {
    props.onAdd(value, e);
    setValue("");
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  return (
    <Input
      disabled={props.disabled}
      value={value}
      placeholder={props.placeholder}
      onChange={(e) => setValue(e.target.value)}
      onPressEnter={submit}
      suffix={
        <Button
          disabled={props.disabled}
          type="text"
          icon={icon}
          onClick={submit}
        />
      }
    />
  );
};

/**
 * Type of an async function that accepts the apollo client and any number of
 * other parameters.
 */
export type HandlerFunction<
  A extends [ApolloClient<any>] = any,
  R extends FetchResult = FetchResult
> = (...args: A) => Promise<R>;

/**
 * Type of the "other" parameters that can be passed through to a handler
 * function when it's called.
 */
export type HandlerArgs<F extends HandlerFunction> = F extends (
  a: ApolloClient<any>,
  ...args: infer U
) => Promise<any>
  ? U
  : never;

/**
 * Higher-order hook factory for network operations.
 *
 * Generates a hook that runs the given handler and manages loading and error
 * handling. This is similar to just using the useMutation hook, but gives
 * more error handling and also lets us use a full function rather than just
 * the mutation itself.
 */
const getOpHook = <F extends HandlerFunction>(
  handler: F,
  successKey: string
) => {
  return () => {
    const apolloClient = useApolloClient();
    const { t } = useTranslation();
    const [inFlight, setInFlight] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    return {
      inFlight,
      error,
      run: async (...args: HandlerArgs<F>) => {
        setInFlight(true);
        setError(null);

        try {
          const result = await handler(apolloClient, ...args);
          if (result.errors) {
            result.errors.map((error) => {
              console.error(error);
            });
            throw new Error("MUTATION_ERROR");
          }

          if (!result.data) {
            throw new Error("MUTATION_ERROR_MISSING_DATA");
          }

          message.success(t(`admin.program.edit.${successKey}`));
        } catch (e) {
          setError(e);
        } finally {
          setInFlight(false);
        }
      },
    };
  };
};

export type TargetUpdateInput = Readonly<{
  id?: string;
  target: number;
  categoryValue: {
    id?: string;
    name?: string;
    category: {
      id: string;
    };
  };
}>;

export type NewDatasetInput = Readonly<{
  name: string;
  description?: string;
}>;

export type UpdatedDatasetInput = Readonly<{
  id: string;
  name?: string;
  description?: string;
}>;

export type ProgramUpdateInput = Readonly<{
  id: string;
  name?: string;
  description?: string;
  teamId?: string;
  targets?: TargetUpdateInput[];
  datasets?: Array<NewDatasetInput | UpdatedDatasetInput>;
}>;

export type DatasetFormValues = Readonly<{
  id?: string;
  name: string;
  description: string | null;
}>;

export type ProgramUpdateFormValues = Readonly<{
  name: string;
  description: string;
  teamId: string;
  datasets: DatasetFormValues[];
  targets: CategoryTarget[];
}>;

/**
 * State and functions related to deactivating a program.
 */
const useDeactivate = getOpHook(
  async (apolloClient: ApolloClient<any>, id: string) => {
    throw new Error("Deactivate is not implemented");
  },
  "deactivateSuccess"
);

/**
 * State and functions related to saving a program.
 */
const useSave = getOpHook(
  async (
    apolloClient: ApolloClient<any>,
    programId: string,
    input: ProgramUpdateFormValues
  ) => {
    const targets = input.targets.reduce((allTargets, current) => {
      current.segments.forEach((segment) => {
        allTargets.push({
          id: segment.targetId,
          target: segment.targetValue,
          categoryValue: {
            id: segment.categoryValueId,
            name: segment.categoryValueName,
            category: {
              id: current.categoryId,
            },
          },
        });
      });
      return allTargets;
    }, [] as TargetUpdateInput[]);

    return apolloClient.mutate({
      mutation: ADMIN_UPDATE_PROGRAM,
      variables: {
        input: {
          id: programId,
          name: input.name,
          description: input.description,
          datasets: input.datasets.map((dataset) => ({
            id: dataset.id,
            name: dataset.name,
            description: dataset.description,
          })),
          targets,
        },
      },
    });
  },
  "saveSuccess"
);

/**
 * State and functions related to restoring a deleted program.
 */
const useRestore = getOpHook(
  async (apolloClient: ApolloClient<any>, id: string) => {
    throw new Error("Restore is not implemented");
  },
  "restoreSuccess"
);

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
  });

  const teamsResponse = useQueryWithErrorHandling<AdminGetAllTeams>(
    ADMIN_GET_ALL_TEAMS,
    "teams"
  );

  const catsResponse = useQueryWithErrorHandling<AdminGetAllCategories>(
    ADMIN_GET_ALL_CATEGORIES,
    "categories"
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
            message={t("admin.program.edit.alreadyDeletedTitle")}
            description={t("admin.program.edit.alreadyDeletedInfo")}
            type="warning"
            action={
              <Button
                type="primary"
                danger
                onClick={() => restore.run(programId)}
              >
                {t("admin.program.edit.restore")}
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
              a.children.toLowerCase().localCompare(b.children.toLowerCase())
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
              {targetFields.map((targetField, index) => (
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
                                    "admin.program.edit.form.addNewSegment"
                                  )}
                                  onAdd={(newSegment, event) => {
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
                            name={[datasetField.name, "name"]}
                          >
                            <Input disabled={inactive} />
                          </Form.Item>
                        }
                        description={
                          <Form.Item
                            label={t(
                              "admin.program.edit.form.datasetDescription"
                            )}
                            wrapperCol={{ span: 24 }}
                            name={[datasetField.name, "description"]}
                          >
                            <Input.TextArea disabled={inactive} />
                          </Form.Item>
                        }
                      />
                    </List.Item>
                  ))}
                  <List.Item>
                    <Button
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

        <Form.Item
          style={{ paddingTop: 48 }}
          wrapperCol={{ offset: 8, span: 16 }}
        >
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
            onConfirm={() => deactivate.run(programId)}
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
      </Form>
    </div>
  );
};
