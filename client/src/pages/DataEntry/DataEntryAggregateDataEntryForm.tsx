import React, {
  ChangeEvent,
  Dispatch,
  FormEvent,
  SetStateAction,
  useState,
} from "react";
import { Alert, Button, Col, Row, Space, Typography } from "antd";
import { SaveOutlined, CloseSquareFilled } from "@ant-design/icons";
import "./DataEntryAggregateDataEntryForm.css";
import { useMutation } from "@apollo/client";
import { GET_DATASET } from "../../graphql/__queries__/GetDataset.gql";
import dayjs from "dayjs";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CREATE_RECORD } from "../../graphql/__mutations__/CreateRecord";
import { GetRecord } from "../../graphql/__generated__/GetRecord";
import { UPDATE_RECORD } from "../../graphql/__mutations__/UpdateRecord.gql";
import { formMessageHandler } from "./DataEntryMessageHandler";
import { GetDataset } from "../../graphql/__generated__/GetDataset";
import { DataEntryCategorySections } from "./DataEntryCategorySections";
import { useCreateRecordMutation, useUpdateRecordMutation } from "./hooks";

const { Text } = Typography;

interface FormProps {
  datasetData: GetDataset | undefined;
  datasetId: string;
  recordId?: string;
  existingRecord?: GetRecord | undefined;
  onFormSubmitted: Dispatch<SetStateAction<boolean>>;
}

export interface Entry {
  entryId?: string;
  index: number;
  categoryValueId: string;
  category: string;
  categoryValue: string;
  categoryValueLabel: string;
  description: string;
  count: number | any;
}

/**
 * Function creates a new dataset record input object with entries.
 * @param {GetDataset} dataset object
 * @param {GetRecord} record and entried object
 * @returns form for rendering data entry fields
 */
export const renderForm = (
  metadata: GetDataset | undefined,
  existingRecord?: GetRecord | undefined
) => {
  let form: Array<Entry>;

  if (existingRecord) {
    form = existingRecord?.record?.entries.map((entry, index) => ({
      entryId: entry.id,
      index: index,
      category: entry.categoryValue.category.name,
      description: entry.categoryValue.category.description,
      categoryValueId: entry.categoryValue.id,
      categoryValue: entry.categoryValue.name,
      categoryValueLabel: entry.categoryValue.name.replace(/\s+/g, "-"),
      count: entry.count,
    }));
  } else {
    form = metadata?.dataset?.program?.targets.map((target, index) => ({
      index: index,
      category: target.categoryValue.category.name,
      description: target.categoryValue.category.description,
      categoryValueId: target.categoryValue.id,
      categoryValue: target.categoryValue.name,
      categoryValueLabel: target.categoryValue.name.replace(/\s+/g, "-"),
      count: 0,
    })) as Array<Entry>;
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

  // // get/set state when "save and add another" button is clicked
  const [isSaveAndAddAnotherRecord, setIsSaveAndAddAnotherRecord] =
    useState<boolean>();

  const { createRecord, loadingRecordCreation, errorOnCreate } =
    useCreateRecordMutation({ datasetId: props.datasetId });

  const { updateRecord, errorOnRecordUpdate } = useUpdateRecordMutation({
    datasetId: props.datasetId,
  });

  const [error, setError] = useState<Error>();
  const dupeRecordErrorMessage = `A record with date ${formPublicationDate}
      already exists for this dataset. Please enter a new date and try again or edit the existing
      record.`;

  /**
   * Function creates a new dataset record input object with entries.
   * @returns mutation to create a record
   */
  const create = () => {
    const newRecord = {
      input: {
        datasetId: props.datasetId,
        publicationDate: formPublicationDate,
        entries: values?.map((newEntry) => ({
          categoryValueId: newEntry.categoryValueId,
          count: newEntry.count,
        })),
      },
    };
    return createRecord({
      variables: newRecord,
    });
  };

  /**
   * Function creates an updated dataset record input object with entries.
   * @returns mutation to update a record
   */
  const update = async () => {
    const updatedRecord = {
      input: {
        id: props.recordId,
        datasetId: props.datasetId,
        publicationDate: formPublicationDate,
        entries: values?.map((updatedEntry) => ({
          id: updatedEntry.entryId,
          categoryValueId: updatedEntry.categoryValueId,
          count: updatedEntry.count,
        })),
      },
    };

    return updateRecord({
      variables: updatedRecord,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSaveAndAddAnotherRecord) {
      return handleSubmitForSaveAndAddNewRecord();
    }

    try {
      const data = isEditMode ? await update() : await create();
      if (data) return props.onFormSubmitted(true);
    } catch (err) {
      return setError(err);
    }
  };

  const handleSubmitForSaveAndAddNewRecord = async () => {
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
        setIsSaveAndAddAnotherRecord(false);
      }
    } catch (err) {
      setError(err);
    }
  };

  const clearState = () => {
    setValues(entries);
    setFormPublicationDate("");
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
      {errorOnCreate && error && (
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
      {errorOnRecordUpdate && error && (
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
          <Text>Released on: </Text>{" "}
          <span
            className="data-entry-form_required-field"
            aria-labelledby="publicationDate"
          >
            {" * "}
          </span>
          <input
            type="date"
            id="publicationDate"
            name="publicationDate"
            aria-label="publicationDate"
            value={formPublicationDate}
            required
            aria-required="true"
            onChange={(e) => setFormPublicationDate(e.target.value)}
          />
        </label>
      </div>
      <DataEntryCategorySections
        entries={values}
        onValueChange={handleChange}
      />
      <Row className="data-entry-form_buttons">
        <Col span={16} offset={8}>
          <Space wrap>
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
                  onClick={() => setIsSaveAndAddAnotherRecord(true)}
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
        </Col>
      </Row>
    </form>
  );
};

export { DataEntryAggregateDataEntryForm };
