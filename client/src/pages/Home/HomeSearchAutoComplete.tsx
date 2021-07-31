import { AutoComplete, Input } from "antd";
import "./HomeSearchAutoComplete.css";

const { Search } = Input;

interface AutoCompleteProps {
  onSearch: (text: string) => void;
}

const HomeSearchAutoComplete = ({
  onSearch,
}: AutoCompleteProps): JSX.Element => {
  const searchBarLabel = "Search team and dataset";

  return (
    <>
      <label htmlFor="Search">
        <span className="visually-hidden">{searchBarLabel}</span>
      </label>
      <AutoComplete
        style={{ width: 300 }}
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
