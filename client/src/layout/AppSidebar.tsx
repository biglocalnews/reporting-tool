import React from "react";
import { Layout, Menu } from "antd";
import { TeamOutlined, BarChartOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import i18next from "../services/i18next";
import { Link } from "react-router-dom";
import {
  GetUser,
  GetUserVariables,
  GetUser_user_teams_programs_datasets,
} from "../__generated__/getUser";
import { GET_USER } from "../__queries__/GetUser.gql";
import { useQuery } from "@apollo/client";

const { SubMenu } = Menu;
const { Sider } = Layout;

interface Dataset {
  id: string;
  title: string;
}

const AppSidebar = (): JSX.Element => {
  const { t, i18n } = useTranslation();

  const { data, loading, error } = useQuery<GetUser, GetUserVariables>(
    GET_USER,
    { variables: { id: "1" } }
  );

  const sidebarPrograms = data?.user?.teams.flatMap((team) =>
    team.programs.map((program) => {
      return {
        key: program.id,
        team: program.name,
        datasets: program.datasets.map((dataset) => {
          return {
            id: dataset.id,
            title: dataset.name,
          };
        }),
      };
    })
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
            sidebarPrograms?.map(
              (program: { key: string; team: string; datasets: Dataset[] }) => {
                return (
                  <Menu.ItemGroup key={program.key} title={program.team}>
                    {program.datasets.map((dataset) => (
                      <Menu.Item key={dataset.id}>
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
          <div style={{ padding: "20px", background: "#fff" }}></div>
        </SubMenu>
      </Menu>
    </Sider>
  );
};

export { AppSidebar };
