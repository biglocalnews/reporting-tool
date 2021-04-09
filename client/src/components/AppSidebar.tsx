import React from "react";
import "../App.css";
import { Layout, Menu } from "antd";
import { TeamOutlined, BarChartOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import i18next from "../i18n/i18next";
import { Link } from "react-router-dom";
import { GetUser, GetUserVariables } from "../__generated__/getUser";
import { GET_USER } from "../queries/GetUser.gql";
import { useQuery } from "@apollo/client";

const { SubMenu } = Menu;
const { Sider } = Layout;

// TODO: add gql query for retrieving datasets a user has access to
const programs = [
  {
    key: "25c140cc-6cd0-4bd3-8230-35b56e59481a",
    team: "BBC News",
    datasets: [
      {
        id: "5a8ee1d5-2b5a-49db-b466-68fe50a27cdb",
        title: "Breakfast Hour",
      },
    ],
  },
];

const AppSidebar = () => {
  const { t, i18n } = useTranslation();

  const { data, loading, error } = useQuery<GetUser, GetUserVariables>(
    GET_USER,
    { variables: { id: "1" } }
  );

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
          {loading ? (
            <h1>Loading...</h1>
          ) : (
            programs?.map(
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
            )
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
