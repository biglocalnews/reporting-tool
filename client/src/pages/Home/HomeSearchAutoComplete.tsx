import { AutoComplete, Input } from "antd";
import { useTranslation } from "react-i18next";
import "./HomeSearchAutoComplete.css";

const { Search } = Input;

interface AutoCompleteProps {
  onSearch: (text: string) => void;
}

const HomeSearchAutoComplete = ({
  onSearch,
}: AutoCompleteProps): JSX.Element => {
  const { t } = useTranslation();
  const searchBarLabel = t("searchTeamAndDataset");

  return (
    <>
      <label htmlFor="Search">
        <span className="visually-hidden">{searchBarLabel}</span>
      </label>
      <AutoComplete
        style={{ width: 300 }}
        id="Search"
        aria-label="Search"
        placeholder={searchBarLabel}
        aria-expanded="false"
        onSearch={onSearch}
      >
        <Search allowClear />
      </AutoComplete>
    </>
  );
};

export { HomeSearchAutoComplete };
