import { PlusCircleOutlined } from "@ant-design/icons";
import { AutoComplete, Button, Input } from "antd";
import { useState } from "react";

/**
 * Props for the NewStringInput component.
 */
export type NewStringInputProps = {
  onAdd: (value: string, e: React.MouseEvent | React.KeyboardEvent) => void;
  icon?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  options?: string[];
};

/**
 * Text input with a button to submit a new string and then clear the input.
 */
export const NewStringInput = (props: NewStringInputProps) => {
  const [autoCompleteOpen, setAutoCompleteOpen] = useState(false);
  const [value, setValue] = useState("");
  const icon = props.icon || <PlusCircleOutlined />;

  const submit = (e: React.MouseEvent | React.KeyboardEvent) => {
    props.onAdd(value, e);
    setValue("");
    setAutoCompleteOpen(false);
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  const input = (
    <Input
      disabled={props.disabled}
      value={value}
      aria-label={props.placeholder}
      placeholder={props.placeholder}
      onChange={(e) => setValue(e.target.value)}
      onPressEnter={submit}
      suffix={
        <Button
          disabled={props.disabled}
          aria-label={props.placeholder}
          type="text"
          icon={icon}
          onClick={submit}
        />
      }
    />
  );

  if (!props.options) {
    return input;
  }

  return (
    <AutoComplete
      disabled={props.disabled}
      options={props.options
        .slice()
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value }))}
      value={value}
      onFocus={() => setAutoCompleteOpen(true)}
      onBlur={() => setAutoCompleteOpen(false)}
      onChange={(data) => {
        setValue(data);
        setAutoCompleteOpen(!!data);
      }}
      open={autoCompleteOpen}
      onSelect={(data: string) => {
        setValue(data);
        setAutoCompleteOpen(false);
      }}
      filterOption={(input, option) =>
        option!.value.toLowerCase().indexOf(input.toLowerCase()) >= 0
      }
    >
      {input}
    </AutoComplete>
  );
};
