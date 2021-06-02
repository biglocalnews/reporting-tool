import React, {
  ChangeEvent,
  Dispatch,
  FormEvent,
  SetStateAction,
  useState,
} from "react";
import { Alert, Button, Card, Col, Row, Space, Typography } from "antd";
import { SaveOutlined, CloseSquareFilled } from "@ant-design/icons";
import "./DataEntryAggregateDataEntryForm.css";
import { useMutation } from "@apollo/client";
import { GET_DATASET } from "../../__queries__/GetDataset.gql";
import dayjs from "dayjs";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CREATE_RECORD } from "../../__mutations__/CreateRecord";
import { GetRecord } from "../../__generated__/GetRecord";
import { UPDATE_RECORD } from "../../__mutations__/UpdateRecord.gql";
import { formMessageHandler } from "./DataEntryMessageHandler";
import { GetDataset } from "../../__generated__/GetDataset";

const { Text } = Typography;

interface FormProps {
  datasetData: GetDataset | undefined;
  datasetId: string;
  recordId?: string;
  existingRecord?: GetRecord | undefined;
  onFormSubmitted: Dispatch<SetStateAction<boolean>>;
}

interface Entry {
  id?: string;
  categoryId: string;
  category: string;
  categoryValue: string;
  categoryValueLabel: string;
  count: number | any;
}

const renderForm = (
  metadata: GetDataset | undefined,
  existingRecord: GetRecord | undefined
) => {
  let form: Entry[];

  if (existingRecord) {
    form = existingRecord?.record?.entries.map((record) => ({
      ...record.category,
      id: record.id,
      categoryId: record.category.id,
      categoryValueLabel: record.category.categoryValue.replace(/\s+/g, "-"),
      count: record.count,
    }));
  } else {
    form = metadata?.dataset.program.targets.map((target) => ({
      ...target.category,
      categoryId: target.category.id,
      categoryValueLabel: target.category.categoryValue.replace(/\s+/g, "-"),
      count: 0,
    })) as Entry[];
  }

  return form;
};

const DataEntryAggregateDataEntryForm = (props: FormProps): JSX.Element => {
  const { t } = useTranslation();
  const history = useHistory();

  const isEditMode = props.recordId ? true : false;

  const entries = renderForm(props.datasetData, props.existingRecord);
  const [values, setValues] = useState<Entry[]>(entries);

  const [formPublicationDate, setFormPublicationDate] = useState<string>(
    dayjs(props.existingRecord?.record?.publicationDate).format("YYYY-MM-DD")
  );

  const [error, setError] = useState<Error>();
  const dupeRecordErrorMessage = `A record with date ${formPublicationDate}
      already exists for this dataset. Please enter a new date and try again or edit the existing
      record.`;

  const [
    createRecord,
    { data: newRecordData, loading: loadingRecordCreation, error: createError },
  ] = useMutation(CREATE_RECORD, {
    awaitRefetchQueries: true,
    refetchQueries: [
      {
        query: GET_DATASET,
        variables: { id: props.datasetId },
      },
    ],
  });

  const create = () => {
    const newRecord = {
      input: {
        datasetId: props.datasetId,
        publicationDate: formPublicationDate,
        entries: values?.map((d) => ({
          categoryId: d.categoryId,
          count: d.count,
        })),
      },
    };
    return createRecord({
      variables: newRecord,
    });
  };

  const [
    updateRecord,
    {
      data: updatedRecordData,
      loading: loadingRecordUpdate,
      error: updateError,
    },
  ] = useMutation(UPDATE_RECORD, {
    onCompleted: (data) => {
      if (data) props.onFormSubmitted(true);
    },
    awaitRefetchQueries: true,
    refetchQueries: [
      {
        query: GET_DATASET,
        variables: { id: props.datasetId },
      },
    ],
  });

  const update = () => {
    const updatedRecord = {
      input: {
        id: props.recordId,
        datasetId: props.datasetId,
        publicationDate: formPublicationDate,
        entries: values?.map((d) => ({
          id: d.id,
          categoryId: d.categoryId,
          count: d.count,
        })),
      },
    };
    return updateRecord({
      variables: updatedRecord,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isEditMode) {
      try {
        await update();
      } catch (err) {
        setError(err);
      }
    }

    try {
      const data = await create();
      if (data) props.onFormSubmitted(true);
    } catch (err) {
      setError(err);
    }
  };

  const handleSubmitReload = async () => {
    try {
      const data = await create();
      if (loadingRecordCreation) {
        formMessageHandler({
          messageKey: "createRecord",
          isLoading: loadingRecordCreation,
        });
      }
      if (data) {
        formMessageHandler({
          messageKey: "createRecord",
          isSuccess: true,
        });
        clearState();
      }
    } catch (err) {
      setError(err);
    }
  };

  const clearState = () => {
    setValues(entries);
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const newValues = [...values];
    newValues[index] = {
      ...newValues[index],
      count: isNaN(+event.target.value) ? "" : +event.target.value,
    };
    setValues(newValues);
  };

  // TODO: prevent user from editing date
  return (
    <form onSubmit={handleSubmit} id="data-entry-form" aria-label="Data Entry">
      {createError && error && (
        <Alert
          message="Oh, no! Something went wrong"
          description={
            error.message.includes("duplicate key value")
              ? dupeRecordErrorMessage
              : `${error.message} \nPlease refresh and try again.`
          }
          type="error"
          showIcon
          closable
        />
      )}
      {updateError && error && (
        <Alert
          message="Oh, no! Something went wrong"
          description={`${error.message} \nPlease refresh and try again.`}
          type="error"
          showIcon
          closable
        />
      )}
      <div className="data-entry_publication-date-field">
        <label htmlFor="publicationDate">
          <Text>Released on: </Text>
          <input
            type="date"
            id="publicationDate"
            name="publicationDate"
            aria-label="publicationDate"
            value={formPublicationDate}
            aria-required="true"
            required
            onChange={(e) => setFormPublicationDate(e.target.value)}
          />
        </label>
      </div>
      <Row gutter={[16, 16]} className="data-entry">
        <Col span={8}>
          <h3 className="data-entry_category-descr-header">
            {t("aboutAttribute", { attribute: "Gender" })}
          </h3>
          <Text>
            {t("attributeDescription", {
              description: `Gender identity expresses one's innermost concept of self as male,
        female, a blend of both or neither - how individuals perceive
        themselves and what they call themselves. Someone's gender identity
        can be the same (cisgender) or different (transgender) from their
        sex assigned at birth.`,
            })}
          </Text>
        </Col>
        <Col span={16}>
          <Card type="inner" title="Gender">
            <div className="data-entry-form_input-grid">
              {values.map((item, index) => (
                <label
                  key={index}
                  id={item.categoryValueLabel}
                  htmlFor={item.categoryValue}
                  className="data-entry-form_label"
                >
                  <input
                    name={item.categoryValue}
                    required
                    aria-labelledby={item.categoryValueLabel}
                    aria-required="true"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    value={item.count}
                    onChange={(e) => handleChange(e, index)}
                  />
                  {` ${item.categoryValue} `}
                  <span
                    className="data-entry-form_required-field"
                    aria-labelledby={item.categoryValueLabel}
                  >
                    *
                  </span>
                </label>
              ))}
            </div>
          </Card>

          <div className="data-entry-form_buttons">
            <Space>
              {isEditMode ? (
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  style={{ whiteSpace: "normal", height: "auto" }}
                >
                  {t("saveRecord", {
                    buttonTitle: "Update",
                  })}
                </Button>
              ) : (
                <>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    style={{ whiteSpace: "normal", height: "auto" }}
                  >
                    {t("saveRecord", {
                      buttonTitle: "Save",
                    })}
                  </Button>
                  <Button
                    htmlType="button"
                    icon={<SaveOutlined />}
                    style={{ whiteSpace: "normal", height: "auto" }}
                    onClick={() => handleSubmitReload()}
                  >
                    {t("saveRecord", {
                      buttonTitle: "Save and Add Another",
                    })}
                  </Button>
                </>
              )}
              <Button
                htmlType="button"
                onClick={() => history.push("/")}
                icon={<CloseSquareFilled />}
                style={{ whiteSpace: "normal", height: "auto" }}
              >
                {t("cancelAndReturnToDashBoard")}
              </Button>
            </Space>
          </div>
        </Col>
      </Row>
    </form>
  );
};

export { DataEntryAggregateDataEntryForm };
