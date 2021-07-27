import { AutoComplete, Input } from "antd";
import { useTranslation } from "react-i18next";
import "./DatasetsSearchAutoComplete.css";

const { Search } = Input;

interface AutoCompleteProps {
  onSearch: (text: string) => void;
}

const HomeSearchAutoComplete = ({
  onSearch,
}: AutoCompleteProps): JSX.Element => {
  const { t } = useTranslation();

  return (
    <AutoComplete
      style={{ width: 300 }}
      aria-label="Search"
      placeholder={`Search ${t("Dataset_plural")}`}
      aria-expanded="false"
      onSearch={onSearch}
    >
      <Search allowClear />
    </AutoComplete>
  );
};

export { HomeSearchAutoComplete };
