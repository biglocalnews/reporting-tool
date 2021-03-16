import React from "react";
import "../App.css";
import { Layout, Menu } from "antd";
import { TeamOutlined, BarChartOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import i18next from "../i18n/i18next";

const { SubMenu } = Menu;
const { Sider } = Layout;

function AppSidebar() {
  const { t, i18n } = useTranslation();

  return (
    <Sider width="auto" className="sidebar" breakpoint="md">
      <Menu
        mode="inline"
        theme="light"
        defaultSelectedKeys={["1"]}
        defaultOpenKeys={["teams", "stats"]}
        style={{ height: "100%", borderRight: 0 }}
      >
        <SubMenu
          key="teams"
          title={t("teamsSideBarTitle")}
          icon={<TeamOutlined />}
        >
          <Menu.ItemGroup title="BBC News">
            <Menu.Item key="1">Weekday Early 0900-1300</Menu.Item>
            <Menu.Item key="2">News At One 1300-1330</Menu.Item>
            <Menu.Item key="3">Weekday Afternoon 1330-1700</Menu.Item>
          </Menu.ItemGroup>
          <Menu.ItemGroup title="BBC Radio Devon">
            <Menu.Item key="4">Breakfast</Menu.Item>
            <Menu.Item key="5">Afternoon</Menu.Item>
          </Menu.ItemGroup>
        </SubMenu>
        <SubMenu key="stats" title="My Stats" icon={<BarChartOutlined />}>
          <div style={{ padding: "20px", background: "#fff" }}>
            Chart here
            </div>
        </SubMenu>
      </Menu>
    </Sider>
  );
}

export { AppSidebar };
