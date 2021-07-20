import { PageHeader, PageHeaderProps, Typography } from "antd";
import React from "react";

const { Text } = Typography;

// interface inherits the properties of PageHeaderProps
// and requires the originally optional title and subtitle properties
interface DefaultProps extends Omit<PageHeaderProps, "title" & "subTitle"> {
  title: React.ReactNode;
  subtitle: React.ReactNode;
}

export const PageTitleBar: React.FC<DefaultProps> = (
  titleBarProps: DefaultProps
): JSX.Element => {
  return (
    <PageHeader
      {...titleBarProps}
      className="pageTitleBar"
      title={<Text style={{ fontSize: "x-large" }}>{titleBarProps.title}</Text>}
      subTitle={
        <Text style={{ fontSize: "large" }}>{titleBarProps.subtitle}</Text>
      }
    />
  );
};
