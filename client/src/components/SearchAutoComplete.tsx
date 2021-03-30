import React from "react";
import { AutoComplete, Input } from "antd";
import { useTranslation } from "react-i18next";
import "./SearchAutoComplete.css";

interface Props {
  dataSource: [];
  // onTextChange: (text: string) => void;
}

const SearchAutoComplete = ({ dataSource }: Props) => {
  const { t, i18n } = useTranslation();

  return (
    <AutoComplete
      style={{ width: 300, float: "right", marginBottom: "10px" }}
      aria-label="Search"
      dropdownMatchSelectWidth={252}
      dataSource={dataSource}
      placeholder={`Search your ${t("programs")}`}
      filterOption={(inputValue, option) =>
        option?.value.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
      }
      aria-expanded="false"
      notFoundContent={`${t("program")} not found`}
    >
      <Input.Search size="middle" enterButton />
    </AutoComplete>
  );
};

export { SearchAutoComplete };
