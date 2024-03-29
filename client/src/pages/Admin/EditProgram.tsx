import {
  CloseCircleOutlined,
  DeleteOutlined,
  PlusCircleOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { useQuery } from "@apollo/client/react/hooks";
import {
  Alert,
  AutoComplete,
  Button,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  List,
  PageHeader,
  Popconfirm,
  Radio,
  Row,
  Select,
  Spin,
  Switch,
  Typography,
} from "antd";
const { Option } = Select;
import { FormListOperation } from "antd/lib/form/FormList";
import moment from "moment";
const { RangePicker } = DatePicker;
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Loading } from "../../components/Loading/Loading";
import { NewStringInput } from "../../components/NewStringInput";
import { useQueryWithErrorHandling } from "../../graphql/hooks/useQueryWithErrorHandling";
import { AdminGetAllCategories } from "../../graphql/__generated__/AdminGetAllCategories";
import { AdminGetAllCustomColumns } from "../../graphql/__generated__/AdminGetAllCustomColumns";
import { AdminGetAllPersonTypes } from "../../graphql/__generated__/AdminGetAllPersonTypes";
import { AdminGetAllTeams } from "../../graphql/__generated__/AdminGetAllTeams";
import {
  AdminGetProgram,
  AdminGetProgramVariables,
  AdminGetProgram_program_targets,
} from "../../graphql/__generated__/AdminGetProgram";
import { GetAllTags } from "../../graphql/__generated__/GetAllTags";
import { ReportingPeriodType } from "../../graphql/__generated__/globalTypes";

import { ADMIN_GET_ALL_CATEGORIES } from "../../graphql/__queries__/AdminGetAllCategories.gql";
import { ADMIN_GET_ALL_CUSTOM_COLUMNS } from "../../graphql/__queries__/AdminGetAllCustomColumns.gql";
import { ADMIN_GET_ALL_PERSON_TYPES } from "../../graphql/__queries__/AdminGetAllPersonTypes.gql";
import { ADMIN_GET_ALL_TEAMS } from "../../graphql/__queries__/AdminGetAllTeams.gql";
import { ADMIN_GET_PROGRAM } from "../../graphql/__queries__/AdminGetProgram.gql";
import { GET_ALL_TAGS } from "../../graphql/__queries__/GetAllTags.gql";
import {
  Target,
  TargetTrack,
  ProgramUpdateFormValues,
  useDeactivate,
  useRestore,
  useSave,
  ReportingPeriod,
} from "./programHooks";

import { usePrompt } from "../../components/usePrompt";
import { catSort } from "../CatSort";
import { ADMIN_GET_ALL_DATASETS } from "../../graphql/__queries__/AdminGetAllDatasets.gql";
import { AdminGetAllDatasets } from "../../graphql/__generated__/AdminGetAllDatasets";

/**
 * URL parameters expected for this page.
 */
export type EditProgramRouteParams = Readonly<{
  programId: string;
}>;

const getGroupedTargets = (
  targets: readonly AdminGetProgram_program_targets[]
) => {
  const groupedByCategory = targets
    //.sort((a, b) => a.category.name.localeCompare(b.category.name))
    .reduce((grouped, currTarget) => {
      if (!grouped.has(currTarget.category.id)) {
        grouped.set(currTarget.category.id, {
          id: currTarget.id,
          category: currTarget.category,
          target: currTarget.target,
          tracks: [],
        });
      }
      currTarget.tracks
        .flat()
        .sort((a, b) => a.categoryValue.name.localeCompare(b.categoryValue.name))
        .forEach(track => {
          grouped.get(currTarget.category.id)?.tracks.push(
            {
              id: track.id,
              categoryValue: track.categoryValue,
              targetMember: track.targetMember,
            }
          );
        });

      return grouped;
    }, new Map<string, Target>());

  return Array.from(groupedByCategory.values()).sort((a, b) => b.target - a.target);

}

const onClickAddNewReportingPeriod = (reportingPeriods: ReportingPeriod[], reportingPeriodType: ReportingPeriodType, formOperations: FormListOperation) => {
  const lastDate = reportingPeriods.filter(x => x && x.range).length ? [...reportingPeriods]
    .filter(x => x && x.range)
    .sort((a, b) => b.range[1].unix() - a.range[1].unix())
  [0].range[1].clone() : null;

  switch (reportingPeriodType) {
    case "monthly": {
      const addArrayOfMonths = (startDate: moment.Moment) => {
        const endOfYear = startDate.clone().endOf("year").utc();
        startDate.startOf("year").utc();
        while (startDate.isBefore(endOfYear)) {
          formOperations.add({
            range: [
              startDate.clone().startOf("month"),
              startDate.clone().endOf("month")
            ],
            description: `${startDate.format("MMMM")}`,
            groupKey: `${startDate.format("YYYY")}-months`
          })
          startDate.add(1, "hour").add(1, "month");
        }
      }
      if (!reportingPeriods || !reportingPeriods.length || !lastDate) {
        return addArrayOfMonths(moment());
      }

      return addArrayOfMonths(lastDate.add(1, "month"));
    }
    case "quarterly": {
      const addArrayOfQuarters = (startDate: moment.Moment) => {
        const endOfYear = startDate.clone().endOf("year").utc();
        startDate.startOf("quarter").utc();
        while (startDate.isBefore(endOfYear)) {
          formOperations.add({
            range: [
              startDate.clone().startOf("quarter"),
              startDate.clone().endOf("quarter")
            ],
            description: `Quarter ${startDate.quarter()}`,
            groupKey: `${startDate.format("YYYY")}-quarters`
          })
          startDate.add(1, "hour").add(1, "quarter");
        }
      }
      if (!reportingPeriods || !reportingPeriods.length || !lastDate) {
        return addArrayOfQuarters(moment());
      }

      return addArrayOfQuarters(lastDate.add(1, "quarter"));
    }
    case "annual": {
      const addArrayOfYears = (startDate: moment.Moment) => {
        formOperations.add({
          range: [
            startDate.clone().startOf("year"),
            startDate.clone().endOf("year")
          ],
          description: `${startDate.format("YYYY")}`
        })

      }
      if (!reportingPeriods || !reportingPeriods.length || !lastDate) {
        return addArrayOfYears(moment());
      }

      return addArrayOfYears(lastDate.year(lastDate.year() + 1));
    }
    default: {
      return formOperations.add();
    }
  }
}

/**
 * Form to edit or delete a program.
 */
export const EditProgram = (): JSX.Element => {
  const [dirty, setDirty] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { programId } = useParams() as EditProgramRouteParams;
  const [editForm] = Form.useForm<ProgramUpdateFormValues>();
  const save = useSave();
  const restore = useRestore();
  const deactivate = useDeactivate();
  const [showDatasets, setShowDatasets] = useState(false);
  const [newTagValue, setNewTagValue] = useState<{ name: string } | undefined>();

  const programResponse = useQueryWithErrorHandling<
    AdminGetProgram,
    AdminGetProgramVariables
  >(ADMIN_GET_PROGRAM, "program", {
    variables: { id: programId ?? "" },
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

  const tagsResponse = useQueryWithErrorHandling<GetAllTags>(
    GET_ALL_TAGS,
    "tags"
  );

  const personTypesResponse = useQueryWithErrorHandling<AdminGetAllPersonTypes>(
    ADMIN_GET_ALL_PERSON_TYPES,
    "personTypes"
  );

  const customColumnsResponse = useQueryWithErrorHandling<AdminGetAllCustomColumns>(
    ADMIN_GET_ALL_CUSTOM_COLUMNS,
    "customColumns"
  );

  const { data: datasetsQry, loading: allDatasetsLoading } = useQuery<AdminGetAllDatasets>(
    ADMIN_GET_ALL_DATASETS,
    {
      skip: !showDatasets,
      variables: {
        onlyUnassigned: true
      }
    }
  );


  usePrompt(t("confirmLeavePage"), dirty);

  if (!programId) return <p>bad route</p>;

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
    tags: programResponse.data!.program.tags.map(({ __typename, ...rest }) => { __typename; return { ...rest } }),
    targets: getGroupedTargets(programResponse.data!.program.targets),
    reportingPeriodType: programResponse.data!.program.reportingPeriodType,
    reportingPeriods: programResponse.data!.program.reportingPeriods!
      .map(rp => ({
        ...rp,
        range: [moment.utc(rp?.range?.[0]), moment.utc(rp?.range?.[1])]
      })),
    datasets: programResponse.data!.program.datasets.map((ds) => ({
      ...ds,
      personTypes: ds.personTypes.map(({ personTypeName }) => personTypeName),
      customColumns: ds.customColumns?.map(({ name }) => name),
    })),
  };

  return (
    <div className="admin program-editprogram_container">
      <PageHeader
        onBack={() => navigate("/admin/programs")}
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
        onFieldsChange={() => {
          setDirty(true);
        }}
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 14 }}
        initialValues={initialFormValues}
        onFinish={async (values) => {
          if (await save.run(programId, values)) {
            setDirty(false);
          }
        }}
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
          <Select<string, { value: string; children: string }>
            showSearch
            disabled={inactive}
            filterOption={(input, option) =>
              option!.children.toLowerCase().indexOf(input?.toLowerCase()) >= 0
            }
            filterSort={(a, b) =>
              a!.children.toLowerCase().localeCompare(b!.children.toLowerCase())
            }
          >
            {teamsResponse.data!.teams.map((t) => (
              <Option key={t.id} value={t.id}>
                {t.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.List name="tags">
          {
            (tagFields, tagOps) =>
              <div>
                <Row>
                  <Col offset={2} span={20}><Divider orientation="left">Tags</Divider></Col>
                </Row>
                {
                  tagFields.map(({ key, name, ...restField }) =>
                    <Row key={key}>
                      <Col offset={4} span={8}>
                        <Form.Item
                          {...restField}
                          label={t("admin.program.edit.form.tags.type")}
                          name={[name, "tagType"]}
                          labelCol={{ span: 6 }}
                          wrapperCol={{ span: 18 }}
                          rules={[
                            {
                              required: true,
                              message: t("admin.program.edit.form.validation.tagGroupRequired"),
                            },
                          ]}
                        >
                          <AutoComplete
                            disabled={inactive}
                            options={
                              Array.from(new Set(tagsResponse.data?.tags.map(x => x.tagType)))
                                .map(group => ({ value: group }))
                            }
                            filterOption={(inputValue, option) =>
                              option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          label={t("admin.program.edit.form.tags.name")}
                          name={[name, "name"]}
                          labelCol={{ span: 6 }}
                          wrapperCol={{ span: 18 }}
                          rules={[
                            {
                              required: true,
                              message: t("admin.program.edit.form.validation.tagRequired"),
                            },
                          ]}
                        >
                          <AutoComplete
                            disabled={inactive}
                            options={
                              Array.from(new Set(tagsResponse.data?.tags.map(x => x.name)))
                                .map(name => ({ value: name }))
                            }
                            filterOption={(inputValue, option) =>
                              option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col span={2} style={{ textAlign: "right" }}>
                        <Button
                          aria-label={t("admin.program.edit.form.newTagPrompt")}
                          title={t("admin.program.edit.form.newTagPrompt")}
                          type="text"
                          danger
                          icon={<CloseCircleOutlined />}
                          onClick={() => tagOps.remove(name)}
                        />
                      </Col>
                    </Row>
                  )}
                <Row>
                  <Col offset={14} span={6}>
                    <Form.Item
                      wrapperCol={{ span: 24 }}
                    >
                      <AutoComplete
                        disabled={inactive}
                        placeholder={t("admin.program.edit.form.newTagPrompt")}
                        onChange={(v) => setNewTagValue({ name: v })}
                        onKeyUp={(e) => e.key === 'Enter' && newTagValue && tagOps.add(newTagValue)}
                        options={
                          Object.values(
                            tagsResponse.data?.tags.reduce((grouped, tag) => {
                              const group = tag.tagType.toLowerCase();
                              if (!grouped[group]) {
                                grouped[group] = {
                                  label: (<b>{tag.tagType}</b>),
                                  options: [{
                                    value: tag.name,
                                    label: (<div>{tag.name}</div>)
                                  }]
                                };
                              } else {
                                if (!grouped[group].options.some(x => x.value.toLowerCase() === tag.name.toLowerCase())) {
                                  grouped[group].options.push({
                                    value: tag.name,
                                    label: (<div>{tag.name}</div>)
                                  });
                                }
                              }
                              return grouped;
                            }, {} as Record<string, { label: React.ReactNode, options: { value: string, label: React.ReactNode }[] }>) ?? {}
                          )
                        }

                      />
                    </Form.Item>
                  </Col>
                  <Col span={2} style={{ textAlign: "right" }}>
                    <Button
                      type="text"
                      icon={<PlusCircleOutlined />}
                      onClick={() => newTagValue && tagOps.add(newTagValue)}
                    />
                  </Col>
                </Row>
              </div>
          }
        </Form.List>



        <Typography.Title level={4} style={{ paddingTop: 48 }}>
          {t("admin.program.edit.targetTitle")}
        </Typography.Title>

        <Form.List name="targets">
          {(targetFields, targetOps) => (
            <>
              {
                targetFields.map((targetField) => (
                  <React.Fragment key={targetField.key}>
                    <Row>
                      <Col offset={2} span={20}>
                        <Divider orientation="left">
                          {
                            editForm.getFieldValue([
                              "targets",
                              targetField.name,
                              "category",
                              "name"
                            ])

                          }
                        </Divider>
                      </Col>
                    </Row>
                    <Row key={targetField.key}>
                      <Col span={6} offset={2}>
                        <Form.Item
                          name={[targetField.name, "target"]}
                          labelCol={{ span: 10 }}
                          wrapperCol={{ span: 14 }}
                          label={t(
                            "admin.program.edit.form.targetNumber"
                          )}>
                          <InputNumber
                            type="number"
                            step={0.01}
                            addonAfter="%"
                            formatter={value => `${Math.round(Number(value ?? 0) * 100)}`}
                            parser={value => (Number(value ?? 0) / 100).toFixed(2)}
                          />
                        </Form.Item>
                        <Popconfirm
                          title={t(
                            "admin.program.edit.form.stopTrackingCategoryConfirm"
                          )}
                          onConfirm={() => targetOps.remove(targetField.name)}
                          okText={t("confirm.yes")}
                          cancelText={t("confirm.no")}
                          disabled={inactive}
                        >
                          <Button danger disabled={inactive}>
                            {t("admin.program.edit.form.stopTrackingCategory")}
                          </Button>
                        </Popconfirm>
                      </Col>
                      <Col span={14}>
                        <Form.List
                          rules={[
                            {
                              validator: async (
                                _,
                                segments: TargetTrack[]
                              ) => {
                                if (segments.length === 0) {
                                  throw new Error(
                                    t(
                                      "admin.program.edit.form.validation.needSegments"
                                    )
                                  );
                                }

                                const uniqueNames = new Set(
                                  segments.map((segment) =>
                                    segment.categoryValue.name?.toLowerCase().trim()
                                  )
                                );
                                if (uniqueNames.size !== segments.length) {
                                  throw new Error(
                                    t(
                                      "admin.program.edit.form.validation.uniqueTargets"
                                    )
                                  );
                                }
                              },
                            },
                          ]}
                          name={[targetField.name, "tracks"]}
                        >
                          {(trackFields, trackOps, trackMeta) => (
                            <>
                              {
                                trackMeta.errors && (
                                  <Row>
                                    <Col offset={2}>
                                      <Form.ErrorList errors={trackMeta.errors} />
                                    </Col>
                                  </Row>
                                )}
                              {
                                trackFields.map((segmentField) => (
                                  <Row justify="end" key={segmentField.key}>
                                    <Col span={23}>
                                      <Form.Item
                                        wrapperCol={{ span: 2 }}
                                        labelCol={{ span: 22 }}
                                        label={editForm.getFieldValue([
                                          "targets",
                                          targetField.name,
                                          "tracks",
                                          segmentField.name,
                                          "categoryValue",
                                          "name",
                                        ])}
                                        name={[segmentField.name, "targetMember"]}
                                        valuePropName="checked"
                                      >
                                        <Switch
                                          aria-label={editForm.getFieldValue([
                                            "targets",
                                            targetField.name,
                                            "tracks",
                                            segmentField.name,
                                            "categoryValue",
                                            "name",
                                          ])}
                                        />
                                      </Form.Item>
                                    </Col>
                                    <Col span={1}>
                                      <Form.Item>
                                        <Popconfirm

                                          title={t(
                                            "admin.program.edit.form.confirmStopTrackingSegment"
                                          )}
                                          onConfirm={() =>
                                            trackOps.remove(segmentField.name)
                                          }
                                          okText={t("confirm.yes")}
                                          cancelText={t("confirm.no")}
                                          disabled={inactive}
                                        >
                                          <Button
                                            style={{ display: "inline" }}
                                            disabled={inactive}
                                            danger
                                            aria-label={t(
                                              "admin.program.edit.form.stopTrackingSegment",
                                              {
                                                segment: editForm
                                                  .getFieldValue([
                                                    "targets",
                                                    targetField.name,
                                                    "tracks",
                                                    segmentField.name,
                                                    "categoryValue",
                                                    "name",
                                                  ])
                                                  ?.toLowerCase(),
                                              }
                                            )}
                                            icon={<CloseCircleOutlined />}
                                            type="text"
                                          ></Button>
                                        </Popconfirm>
                                      </Form.Item>
                                    </Col>
                                  </Row>
                                ))}
                              <Row justify="end">
                                <Col>
                                  <NewStringInput
                                    disabled={inactive}
                                    options={(() => {
                                      const target: Target =
                                        editForm.getFieldValue([
                                          "targets",
                                          targetField.name,
                                        ]);
                                      const values =
                                        catsResponse
                                          .data!.categories.find(
                                            (cat) =>
                                              cat.id === target.category.id
                                          )
                                          ?.categoryValues.map((cv) => cv.name) ||
                                        [];
                                      return values.filter(
                                        (value) =>
                                          !target.tracks.some(
                                            (segment) =>
                                              segment.categoryValue.name?.toLowerCase() ===
                                              value.toLowerCase()
                                          )
                                      );
                                    })()}
                                    placeholder={t(
                                      "admin.program.edit.form.addNewSegment",
                                      {
                                        category: editForm.getFieldValue([
                                          "targets",
                                          targetField.name,
                                          "category",
                                          "name",
                                        ]),
                                      }
                                    )}
                                    onAdd={(newSegment) => {
                                      if (newSegment) {
                                        trackOps.add({
                                          categoryValue: {
                                            name: newSegment, category: {
                                              id: editForm.getFieldValue([
                                                "targets",
                                                targetField.name,
                                                "category",
                                                "id",
                                              ])
                                            }
                                          },
                                          targetMember: true,
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
                  <Select<string, { value: string; children: string }>
                    disabled={inactive}
                    aria-label={t("admin.program.edit.form.addNewCategory")}
                    value={t("admin.program.edit.form.addCategoryPlaceholder")}
                    onSelect={(newId: string) => {
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
                        category: newCategory,
                        tracks: [],
                      });
                    }}
                  >
                    {
                      catsResponse
                        .data!.categories
                        .flat()
                        .sort((a, b) => catSort(a.name, b.name))
                        .filter(
                          (category) =>
                            !(
                              (editForm?.getFieldValue("targets") ||
                                []) as Target[]
                            ).find((target) => target.category.id === category.id)
                        )
                        .map((category) => (
                          <Option key={category.id} value={category.id}>
                            {category.name}
                          </Option>
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
                          disabled={inactive}
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
                          <>
                            <Form.Item
                              label={t("admin.program.edit.form.personTypes")}
                              name={[datasetField.name, "personTypes"]}
                            >
                              <Select<string, { value: string; children: string }>
                                disabled={inactive}
                                aria-label={t(
                                  "admin.program.edit.form.personTypes"
                                )}
                                mode="tags"
                                placeholder={t(
                                  "admin.program.edit.form.newPersonTypePrompt"
                                )}
                                filterOption={(input, option) =>
                                  option!.children.toLowerCase()
                                    .indexOf(input.toLowerCase()) >= 0
                                }
                              >
                                {personTypesResponse.data?.personTypes.map(
                                  ({ personTypeName }) => (
                                    <Option
                                      key={personTypeName}
                                      value={personTypeName}
                                    >
                                      {personTypeName}
                                    </Option>
                                  )
                                )}
                              </Select>
                            </Form.Item>

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
                            <Form.Item
                              label={t(
                                "admin.program.edit.form.datasetCustomColumns"
                              )}
                              wrapperCol={{ span: 24 }}
                              name={[datasetField.name, "customColumns"]}
                            >
                              <Select<string, { value: string; children: string }>
                                disabled={inactive}
                                aria-label={t(
                                  "admin.program.edit.form.customColumns"
                                )}
                                mode="tags"
                                placeholder={t(
                                  "admin.program.edit.form.newCustomColumnPrompt"
                                )}
                                filterOption={(input, option) =>
                                  option!.children.toLowerCase()
                                    .indexOf(input.toLowerCase()) >= 0
                                }
                              >
                                {customColumnsResponse.data?.customColumns.map(
                                  ({ name, id }) => (
                                    <Option
                                      key={id}
                                      value={name}
                                    >
                                      {name}
                                    </Option>
                                  )
                                )}
                              </Select>
                            </Form.Item>
                          </>
                        }
                      />
                    </List.Item>
                  ))}
                  <List.Item style={{ width: "100%" }} hidden={!showDatasets}>
                    {!allDatasetsLoading ? (
                      <Select<string, { value: string; children: string }>
                        showSearch
                        filterOption={(input, option) =>
                          option!.children.toLocaleLowerCase()
                            .indexOf(input.toLocaleLowerCase()) >= 0
                        }
                        onChange={(value) =>
                          datasetOps.add(datasetsQry?.datasets.find((x) => x.id === value))
                        }
                        style={{ width: "100%" }}
                        placeholder="Select dataset"
                      >
                        {datasetsQry?.datasets.map((dataset, i) => (
                          <option key={i} value={dataset.id}>
                            {dataset.name}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          width: "100%",
                          alignContent: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Spin tip="Loading unassigned datasets" />
                      </div>
                    )}
                  </List.Item>
                  <List.Item>
                    <Button
                      disabled={inactive}
                      aria-label={t(
                        "admin.program.edit.form.addExisitingDataset"
                      )}
                      onClick={() => setShowDatasets((curr) => !curr)}
                      icon={<PlusCircleOutlined />}
                    >
                      {t("admin.program.edit.form.addExistingDataset")}
                    </Button>
                    <Button
                      disabled={inactive}
                      aria-label={t("admin.program.edit.form.addDataset")}
                      onClick={() =>
                        datasetOps.add({ name: "", description: "None" })
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
        <Typography.Title level={4} style={{ paddingTop: 48 }}>
          {t("admin.program.edit.reportingPeriodTitle")}
        </Typography.Title>

        <Row>
          <Col offset={2} span={20}>
            <Form.Item name="reportingPeriodType">
              <Radio.Group>
                {
                  ["monthly", "quarterly", "annual", "custom"].map(
                    option => (
                      <Radio key={option} value={option}>{t(option)}</Radio>
                    )
                  )
                }
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col offset={2} span={20}>
            <Form.Item
              wrapperCol={{ span: 24 }}
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.reportingPeriods !== currentValues.reportingPeriods
              }
            >
              {
                ({ getFieldValue }) =>
                  Array.from(
                    new Set(
                      (getFieldValue("reportingPeriods") as ReportingPeriod[])
                        .filter(x => x && x.range)
                        .flatMap(rp => [rp.range[0].year(), rp.range[1].year()])
                    )
                  )
                    .map((year, i) =>
                      <Button
                        key={i}
                        aria-label={t("admin.program.edit.form.removeReportingPeriodGroup")}
                        icon={<CloseCircleOutlined />}
                        size="large"
                        type="text"
                        danger
                        title={t("admin.program.edit.form.removeReportingPeriodGroup")}
                        onClick={() => {
                          editForm.setFieldsValue({
                            reportingPeriods: (getFieldValue("reportingPeriods") as ReportingPeriod[])
                              .filter(x => !x || !x.range || !x.range || !(x.range[0].year() === year && x.range[1].year() === year))
                          });
                          setDirty(true);
                        }
                        }
                      >
                        {year}
                      </Button>

                    )
              }
            </Form.Item>
          </Col>
        </Row>
        <Form.List
          name="reportingPeriods"
          rules={[
            {
              validator: async (
                _,
                reportingPeriods: ReportingPeriod[]
              ) => {
                if (reportingPeriods.length === 0) {
                  return Promise.reject(new Error(
                    t(
                      "admin.program.edit.form.validation.needReportingPeriods"
                    )
                  ));
                }
              }
            }
          ]}
        >
          {
            (rpFields, rpOps, errors) =>
              <>
                <Row>
                  <Col offset={2} span={20}>
                    <Form.ErrorList errors={errors.errors} />
                  </Col>
                </Row>

                <Row>
                  <Col offset={2} span={20}>
                    <List>
                      {
                        rpFields.map(({ key, name, ...restField }) => (
                          <List.Item key={key}>
                            <Row gutter={16} justify="center" style={{ width: "100%" }}>
                              <Col span={6}>
                                <Form.Item
                                  {...restField}
                                  name={[name, "id"]}
                                  noStyle
                                >
                                  <Input type="hidden" />
                                </Form.Item>
                                <Form.Item
                                  wrapperCol={{ span: 24 }}
                                  shouldUpdate={(prevValues, currentValues) =>
                                    prevValues.reportingPeriodType !== currentValues.reportingPeriodType
                                  }
                                >
                                  {
                                    ({ getFieldValue }) => {
                                      switch (getFieldValue('reportingPeriodType')) {
                                        default: {
                                          return (
                                            <Form.Item
                                              name={[name, "range"]}
                                              rules={[
                                                { required: true, message: 'Please enter a date range' },
                                                {
                                                  validator: (_, value: [moment.Moment, moment.Moment]) => {
                                                    const overlappingPeriods = (getFieldValue("reportingPeriods") as ReportingPeriod[])
                                                      .filter(x => x.range &&
                                                        (value[0].isBetween(x.range[0], x.range[1]) || value[1].isBetween(x.range[0], x.range[1]))
                                                      );
                                                    if (value && overlappingPeriods.length) {
                                                      return Promise.reject(new Error(`
                                                      ${t(
                                                        "admin.program.edit.form.validation.overlappingReportingPeriod"
                                                      )}, ${overlappingPeriods.map(p => p.description)}`
                                                      ));
                                                    }
                                                    else {
                                                      return Promise.resolve();
                                                    }
                                                  }
                                                }
                                              ]}
                                              {...restField}
                                            >
                                              <RangePicker
                                                format={date => date.utc().format("D MMM YYYY")}
                                              />
                                            </Form.Item>
                                          )
                                        }

                                      }
                                    }
                                  }
                                </Form.Item>
                              </Col>
                              <Col span={16}>
                                <Form.Item
                                  {...restField}
                                  name={[name, "description"]}
                                  wrapperCol={{ span: 24 }}
                                  style={{ width: "100%" }}
                                >
                                  <Input style={{ width: "100%" }} placeholder="Description"></Input>
                                </Form.Item>
                              </Col>
                              <Col span={2} style={{ textAlign: "right" }}>
                                <Button
                                  type="text"
                                  aria-label={t("admin.program.edit.form.removeReportingPeriod")}
                                  icon={<CloseCircleOutlined />}
                                  danger
                                  title={t("admin.program.edit.form.removeReportingPeriod")}
                                  onClick={() => rpOps.remove(name)}
                                />
                              </Col>

                            </Row>
                          </List.Item>

                        ))
                      }
                    </List>

                  </Col>
                </Row>
                <Row>
                  <Col offset={2} span={20}>
                    <Form.Item
                      wrapperCol={{ span: 24 }}
                      shouldUpdate={(prevValues, currentValues) => prevValues.reportingPeriodType !== currentValues.reportingPeriodType}
                    >
                      {
                        ({ getFieldValue }) =>
                          <Button
                            icon={<PlusCircleOutlined />}
                            onClick={() => onClickAddNewReportingPeriod(getFieldValue('reportingPeriods'), getFieldValue('reportingPeriodType'), rpOps)}
                          >
                            {t("admin.program.edit.form.addCustomReportingPeriod")}
                          </Button>
                      }
                    </Form.Item>
                  </Col>
                </Row>
              </>
          }
        </Form.List>



        <Row justify="center">
          <Form.Item style={{ paddingTop: 48 }} wrapperCol={{ span: 24 }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
              disabled={deactivate.inFlight || !dirty || inactive}
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
              disabled={dirty || inactive}
              okText={t("confirm.yes")}
              cancelText={t("confirm.no")}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled={dirty || inactive}
                loading={deactivate.inFlight}
              >
                {t("admin.program.edit.form.delete")}
              </Button>
            </Popconfirm>
          </Form.Item>
        </Row>
      </Form>
    </div >
  );
};
