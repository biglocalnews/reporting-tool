import { CloseSquareFilled, SaveOutlined } from "@ant-design/icons";
import { Alert, Button, Col, Row, Space, Typography } from "antd";
import dayjs from "dayjs";
import {
  ChangeEvent,
  Dispatch,
  FormEvent,
  SetStateAction,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { GetDataset } from "../../graphql/__generated__/GetDataset";
import { GetRecord } from "../../graphql/__generated__/GetRecord";
import "./DataEntryAggregateDataEntryForm.css";
import { DataEntryCategorySections } from "./DataEntryCategorySections";
import { formMessageHandler } from "./DataEntryMessageHandler";
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
  personType?: string | null;
}

/**
 * Function creates a new dataset record input object with entries.
 * @param {GetDataset} metadata - dataset metadata object
 * @param {GetRecord} existingRecord - entries object for editing
 */
export const renderFormEntries = (
  metadata: GetDataset | undefined,
  existingRecord?: GetRecord | undefined
): Array<Entry> => {
  const form: Array<Entry> = [];

  /* Entries for editing a record */
  if (existingRecord) {
    return existingRecord?.record?.entries.map((entry, index) => ({
      entryId: entry.id,
      index: index,
      category: entry.categoryValue.category.name,
      description: entry.categoryValue.category.description,
      categoryValueId: entry.categoryValue.id,
      categoryValue: entry.categoryValue.name,
      categoryValueLabel: entry.categoryValue.name.replace(/\s+/g, "-"),
      count: entry.count,
      personType: entry.personType,
    }));
  }

  /* Entries for adding a record */

  // Check if personTypes exist as metadata in dataset and return
  // collection of default entries with person type
  if (
    Array.isArray(metadata?.dataset.personTypes) &&
    metadata?.dataset.personTypes?.length
  ) {
    let startIndex = 0;
    const addDataEntriesCollectionLen =
      metadata?.dataset?.personTypes?.length *
      metadata?.dataset?.program?.targets.length;

    while (startIndex < addDataEntriesCollectionLen) {
      metadata?.dataset.personTypes.map((type) => {
        metadata?.dataset?.program?.targets.map((target) => {
          form.push({
            index: startIndex++,
            category: target.categoryValue.category.name,
            description: target.categoryValue.category.description,
            categoryValueId: target.categoryValue.id,
            categoryValue: target.categoryValue.name,
            categoryValueLabel: target.categoryValue.name.replace(/\s+/g, "-"),
            count: 0,
            personType: type,
          });
        });
      });
    }
  } else {
    console.log("new data no person type");
    metadata?.dataset?.program?.targets.map((target, index) => {
      form.push({
        index: index,
        category: target.categoryValue.category.name,
        description: target.categoryValue.category.description,
        categoryValueId: target.categoryValue.id,
        categoryValue: target.categoryValue.name,
        categoryValueLabel: target.categoryValue.name.replace(/\s+/g, "-"),
        count: 0,
      });
    });
  }

  return form as Array<Entry>;
};

const DataEntryAggregateDataEntryForm = (props: FormProps): JSX.Element => {
  const { t } = useTranslation();
  const history = useHistory();

  const isEditMode = props.recordId ? true : false;

  const entries = renderFormEntries(props.datasetData, props.existingRecord);
  const [values, setValues] = useState<Entry[]>(entries);

  const [formPublicationDate, setFormPublicationDate] = useState<string>(
    dayjs(props.existingRecord?.record?.publicationDate).format("YYYY-MM-DD")
  );

  const {
    createRecord,
    loading: loadingRecordCreation,
    error: errorOnCreate,
  } = useCreateRecordMutation({ datasetId: props.datasetId });

  const { updateRecord, error: errorOnRecordUpdate } = useUpdateRecordMutation({
    datasetId: props.datasetId,
  });

  const [error, setError] = useState<Error>();
  const dupeRecordErrorMessage = `A record with date ${formPublicationDate}
      already exists for this dataset. Please enter a new date and try again or edit the existing
      record.`;

  // NOTE: Refs cannot be as expected to check against the submitter
  // in a form event because Safari browser does not have a submitter property
  // for synthetic events. As a workaround, we are using refs
  // similar to how we would use state hooks but with the tested
  // guarantee that we could call on this boolean and immediately
  // get the updated value once it has been set. Our tests failed when
  // we attempted to do the same with a state hook.
  // TODO: Replace native HTML form with AntD form and test for accessibility
  // to see if setting state for button clicks solves this issue using
  // an AntD form.
  const isSaveAndAddAnotherRecordClicked = useRef(false);
  // set reference when "save and add another" button is clicked
  const setIsSaveAndAddAnotherRecord = (clicked: boolean) => {
    isSaveAndAddAnotherRecordClicked.current = clicked;
  };

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
          personType: newEntry.personType,
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
          personType: updatedEntry.personType,
        })),
      },
    };

    return updateRecord({
      variables: updatedRecord,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // if second save button has been clicked
    if (isSaveAndAddAnotherRecordClicked.current) {
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
    <form
      onSubmit={handleSubmit}
      name="data-entry-form"
      id="data-entry-form"
      aria-label="data-entry-form"
    >
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
        personTypes={props.datasetData?.dataset?.personTypes}
      />
      <Row className="data-entry-form_buttons">
        <Col span={16} offset={8}>
          <Space wrap>
            {isEditMode ? (
              <Button
                type="primary"
                name="save"
                value="update record"
                htmlType="submit"
                icon={<SaveOutlined />}
                style={{ whiteSpace: "normal", height: "auto" }}
                onClick={() => setIsSaveAndAddAnotherRecord(false)}
              >
                {t("saveRecord", {
                  buttonTitle: "Update",
                })}
              </Button>
            ) : (
              <>
                <Button
                  type="primary"
                  name="save"
                  value="save record"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  style={{ whiteSpace: "normal", height: "auto" }}
                  onClick={() => setIsSaveAndAddAnotherRecord(false)}
                >
                  {t("saveRecord", {
                    buttonTitle: "Save",
                  })}
                </Button>
                <Button
                  name="save_add_new"
                  value="save and add another record"
                  htmlType="submit"
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
