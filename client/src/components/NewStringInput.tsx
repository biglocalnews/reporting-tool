import { PlusCircleOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";
import { useState } from "react";

/**
 * Props for the NewStringInput component.
 */
export type NewStringInputProps = {
  onAdd: (value: string, e: React.MouseEvent | React.KeyboardEvent) => void;
  icon?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
};

/**
 * Text input with a button to submit a new string and then clear the input.
 */
export const NewStringInput = (props: NewStringInputProps) => {
  const [value, setValue] = useState("");
  const icon = props.icon || <PlusCircleOutlined />;

  const submit = (e: React.MouseEvent | React.KeyboardEvent) => {
    props.onAdd(value, e);
    setValue("");
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  return (
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
};
