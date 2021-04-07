import React from "react";
import "../App.css";
import { Layout, Menu } from "antd";
import { TeamOutlined, BarChartOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import i18next from "../i18n/i18next";
import { Link } from "react-router-dom";

const { SubMenu } = Menu;
const { Sider } = Layout;

// TODO: add gql query for retrieving datasets a user has access to
const programs: any = [
  {
    key: "1",
    team: "BBC News",
    datasets: [
      {
        key: "1",
        id: 1,
        title: "Instagram",
      },
      {
        key: "2",
        id: 2,
        title: "12pm-4pm",
      },
      {
        key: "3",
        id: 3,
        title: "Breakfast Hour",
      },
    ],
  },
];

const AppSidebar = () => {
  const { t, i18n } = useTranslation();

  return (
    <Sider width="auto" className="sidebar" breakpoint="md">
      <Menu
        mode="inline"
        theme="light"
        defaultOpenKeys={["teams", "stats"]}
        style={{ height: "100%", borderRight: 0 }}
      >
        <SubMenu
          key="teams"
          title={t("teamsSideBarTitle")}
          icon={<TeamOutlined />}
        >
          {programs.map(
            (program: { key: string; team: string; datasets: any[] }) => {
              return (
                <Menu.ItemGroup key={program.key} title={program.team}>
                  {program.datasets.map((dataset) => (
                    <Menu.Item key={dataset.key}>
                      <Link
                        to={{
                          pathname: `/dataset/${dataset.id}/details`,
                        }}
                      >
                        {dataset.title}
                      </Link>
                    </Menu.Item>
                  ))}
                </Menu.ItemGroup>
              );
            }
          )}
        </SubMenu>
        <SubMenu key="stats" title="My Stats" icon={<BarChartOutlined />}>
          <div style={{ padding: "20px", background: "#fff" }}>Chart here</div>
        </SubMenu>
      </Menu>
    </Sider>
  );
};

export { AppSidebar };
