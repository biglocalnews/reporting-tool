import React, {
  ChangeEvent,
  Dispatch,
  FormEvent,
  SetStateAction,
  useState,
} from "react";
import { Button, Card, Col, Row, Space, Typography } from "antd";
import { SaveOutlined, CloseSquareFilled } from "@ant-design/icons";
import "./DataEntryAggregateDataEntryForm.css";
import { useMutation } from "@apollo/client";
import { GET_DATASET } from "../../__queries__/GetDataset.gql";
import dayjs from "dayjs";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FormState } from "./DataEntry";
import { INSERT_RECORD } from "../../__mutations__/InsertRecord.gql";

const { Text } = Typography;

interface FormProps {
  datasetId: string;
  recordId?: string;
  onFormSubmitted: Dispatch<SetStateAction<FormState | undefined>>;
}

interface Record {
  id: string;
  datasetId: string;
  publicationDate: string;
  data: RecordData[];
}

interface RecordData {
  id: string;
  category: string;
  categoryValue: string;
  count: number;
}

// TODO: [FOR DEMO ONLY] replace with query from schema to get categories for a dataset
// Id record doesn't exist (on ADD), populate fields for each category as provided by the dataset
const tempRecord = {
  id: "",
  datasetId: "",
  publicationDate: "",
  data: [
    {
      id: "1",
      category: "gender",
      categoryValue: "men",
      count: 0,
    },
    {
      id: "2",
      category: "gender",
      categoryValue: "non-binary",
      count: 0,
    },
    {
      id: "3",
      category: "gender",
      categoryValue: "women",
      count: 0,
    },
    {
      id: "4",
      category: "gender",
      categoryValue: "transgender",
      count: 0,
    },
    {
      id: "5",
      category: "gender",
      categoryValue: "cisgender",
      count: 0,
    },
    {
      id: "6",
      category: "gender",
      categoryValue: "gender non-conforming",
      count: 0,
    },
  ],
};

const DataEntryAggregateDataEntryForm = (props: FormProps): JSX.Element => {
  const { t } = useTranslation();

  // TODO: query for get_dataset to EDIT a record
  const [InsertRecord, { error: mutationError }] = useMutation(INSERT_RECORD, {
    onCompleted() {
      props.onFormSubmitted({ submitSuccess: true });
    },
    onError() {
      props.onFormSubmitted({ submitSuccess: false, errors: mutationError });
    },
    awaitRefetchQueries: true,
    refetchQueries: [
      {
        query: GET_DATASET,
        variables: { id: props.datasetId },
      },
    ],
  });
  const [values, setValues] = useState<Record>(tempRecord || {});

  // TODO: default will come from graphql query if a record exists
  const [publicationDate, setPublicationDate] = useState<string>(
    dayjs().format("YYYY-MM-DD")
  );

  const history = useHistory();

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const tempValues = { ...values };
    tempValues.data[index] = {
      ...tempValues.data[index],
      count: +event.target.value,
    };
    setValues(tempValues);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const rec = {
      input: {
        datasetId: props.datasetId,
        publicationDate,
        data: values?.data.map((d) => ({
          count: d.count,
          category: d.category,
          categoryValue: d.categoryValue,
        })),
      },
    };

    InsertRecord({
      variables: rec,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="data-entry_publication-date-field">
        <label htmlFor="publicationDate">
          <Text>Released on: </Text>
        </label>
        <input
          type="date"
          id="publicationDate"
          name="publicationDate"
          required
          onChange={(e) => setPublicationDate(e.target.value)}
        />
      </div>
      <Row gutter={[16, 16]} className="data-entry">
        <Col span={8}>
          <h3 className="data-entry_category-descr-header">
            {t("aboutAttribute", { attribute: "Gender" })}
          </h3>
          <Text>{`Gender identity expresses one's innermost concept of self as male,
        female, a blend of both or neither - how individuals perceive
        themselves and what they call themselves. Someone's gender identity
        can be the same (cisgender) or different (transgender) from their
        sex assigned at birth.`}</Text>
        </Col>
        <Col span={16}>
          <Card type="inner" title="Gender">
            <div className="data-entry-form_input-grid">
              {values.data.map((item, index) => (
                <label
                  key={index}
                  htmlFor={item.categoryValue}
                  className="data-entry-form_label"
                >
                  <input
                    name={item.categoryValue}
                    required
                    type="number"
                    min="0"
                    placeholder="0"
                    onChange={(e) => handleChange(e, index)}
                  />{" "}
                  {item.categoryValue}
                </label>
              ))}
            </div>
          </Card>

          <div className="data-entry-form_buttons">
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                style={{ whiteSpace: "normal", height: "auto" }}
              >
                {t("saveRecord")}
              </Button>
              <Button
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
