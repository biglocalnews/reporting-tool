import { Radio, Typography } from "antd";
import React from "react";

const { Text, Title } = Typography;

// TODO: Replace with data for person types from query for dataset
const personTypeOptions = [
  { label: "BBC Staff", value: "bbc" },
  { label: "Non-BBC", value: "nonBBC" },
  { label: "Public Figures", value: "Orange" },
];

const DataEntryPersonTypesInput = (): JSX.Element => {
  return (
    <>
      <Text className="data-entry_record_person_type"> Record refers to: </Text>
      <Radio.Group
        disabled // TODO: enable in future story
        options={personTypeOptions}
        optionType="button"
        buttonStyle="solid"
      />
    </>
  );
};

export { DataEntryPersonTypesInput };
