import {
  BarChartOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  TableOutlined,
  TeamOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { useQuery } from "@apollo/client";
import { Layout, Menu } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { GetUser, GetUserVariables } from "../graphql/__generated__/getUser";
import { GET_USER } from "../graphql/__queries__/GetUser.gql";

const { SubMenu } = Menu;
const { Sider } = Layout;

interface Dataset {
  id: string;
  title: string;
}

/**
 * Sidebar content for normal (non-admin) users.
 */
export const AppNormalUserSidebarMenu = (): JSX.Element => {
  const { t } = useTranslation();
  const userId = useAuth().getUserId();

  const { data, loading } = useQuery<GetUser, GetUserVariables>(GET_USER, {
    variables: { id: userId },
  });

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
      role="menubar"
      theme="light"
      defaultOpenKeys={["teams", "stats"]}
      style={{ height: "100%", borderRight: 0 }}
    >
      <Menu.Item key="home" icon={<DashboardOutlined />}>
        <Link to="/">{t("user.sidebar.home")}</Link>
      </Menu.Item>
      <SubMenu
        key="teams"
        title={t("teamsSideBarTitle")}
        icon={<TeamOutlined />}
      >
        {loading ? (
          <h1>Loading...</h1>
        ) : (
          sidebarPrograms?.map(
            (program: {
              key: string;
              team: string;
              datasets: Array<Dataset>;
            }) => {
              return (
                <Menu.ItemGroup
                  key={program.key}
                  title={
                    <Link
                      to={{
                        pathname: `/`, // go to user homepage
                        search: `?filter=${program.team}`,
                      }}
                    >
                      {program.team}
                    </Link>
                  }
                >
                  {program.datasets.map((dataset) => (
                    <Menu.Item key={dataset.id}>
                      <Link to={`/dataset/${dataset.id}/details`}>
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
  const { t } = useTranslation();
  return (
    <Menu mode="inline" role="menubar">
      <Menu.Item key="alldata" icon={<DatabaseOutlined />} role="menuitem">
        <Link to="/">{t("admin.sidebar.viewAll")}</Link>
      </Menu.Item>
      <Menu.ItemGroup key="admin" title={t("admin.sidebar.controlsHeader")}>
        <Menu.Item key="users" icon={<UserSwitchOutlined />} role="menuitem">
          <Link to="/admin/users">{t("admin.sidebar.manageUsers")}</Link>
        </Menu.Item>
        <Menu.Item key="teams" icon={<TeamOutlined />} role="menuitem">
          <Link to="/admin/teams">{t("admin.sidebar.manageTeams")}</Link>
        </Menu.Item>
        <Menu.Item key="programs" icon={<TableOutlined />} role="menuitem">
          <Link to="/admin/programs">{t("admin.sidebar.managePrograms")}</Link>
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
