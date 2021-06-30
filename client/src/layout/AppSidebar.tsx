import React from "react";
import { Layout, Menu } from "antd";
import {
  DatabaseOutlined,
  TeamOutlined,
  BarChartOutlined,
  UserSwitchOutlined,
  TableOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { GetUser, GetUserVariables } from "../graphql/__generated__/getUser";
import { GET_USER } from "../graphql/__queries__/GetUser.gql";
import { useQuery } from "@apollo/client";
import { useAuth } from "../components/AuthProvider";
import { ErrorFallback } from "../components/Error/ErrorFallback";

const { SubMenu } = Menu;
const { Sider } = Layout;

interface Dataset {
  id: string;
  title: string;
}

/**
 * Sidebar content for normal (non-admin) users.
 */
export const AppNormalUserSidebarMenu = () => {
  const { t, i18n } = useTranslation();
  const userId = useAuth().getUserId();

  const { data, loading, error } = useQuery<GetUser, GetUserVariables>(
    GET_USER,
    {
      variables: { id: userId },
    }
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
  );
};

/**
 * Sidebar content for admin users.
 */
export const AppAdminSidebarMenu = () => {
  const { t, i18n } = useTranslation();
  return (
    <Menu mode="inline">
      <Menu.Item key="alldata" icon={<DatabaseOutlined />}>
        <Link to="/">{t("adminSidebarViewAll")}</Link>
      </Menu.Item>
      <Menu.ItemGroup key="admin" title={t("adminSidebarControlsHeader")}>
        <Menu.Item key="users" icon={<UserSwitchOutlined />}>
          <Link to="/admin/users">{t("adminSidebarManageUsers")}</Link>
        </Menu.Item>
        <Menu.Item key="teams" icon={<TeamOutlined />}>
          <Link to="/admin/teams">{t("adminSidebarManageTeams")}</Link>
        </Menu.Item>
        <Menu.Item key="programs" icon={<TableOutlined />}>
          <Link to="/admin/programs">{t("adminSidebarManagePrograms")}</Link>
        </Menu.Item>
      </Menu.ItemGroup>
    </Menu>
  );
};

/**
 * App sidebar content: info and navigation links
 */
const AppSidebar = (): JSX.Element => {
  const auth = useAuth();
  return (
    <Sider className="sidebar" breakpoint="md">
      {auth.isAdmin() ? <AppAdminSidebarMenu /> : <AppNormalUserSidebarMenu />}
    </Sider>
  );
};

export { AppSidebar };
