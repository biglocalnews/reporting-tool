import {
  BarChartOutlined,
  DatabaseOutlined,
  TableOutlined,
  TeamOutlined,
  SettingOutlined,
  VideoCameraOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { useQuery } from "@apollo/client";
import { Layout, Menu } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { GetUser, GetUserVariables } from "../graphql/__generated__/getUser";
import { GET_USER } from "../graphql/__queries__/GetUser.gql";
import "./AppSidebar.css";
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

export const AppSidebarMenu = () => {
  const { t } = useTranslation();
  const userId = useAuth().getUserId();
  const auth = useAuth();
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
      theme="dark"
      /*defaultOpenKeys={["admin"]}*/
      style={{ height: "100%", borderRight: 0, paddingTop: "10px" }}
    >


      {auth.isAdmin() ? (
      
      <Menu.Item key="alldata" icon={<DatabaseOutlined />} role="menuitem">
        <Link to="/">{t("admin.sidebar.viewAll")}</Link>
      </Menu.Item>
      ) : ""}
      <SubMenu
        key="teams"
        title={t("teamsSideBarTitle")}
        icon={<VideoCameraOutlined />}
      >
        {loading ? (
          <h1>Loading...</h1>
        ) : (
          sidebarPrograms?.map(
            (program: { key: string; team: string; datasets: Dataset[] }) => {
              return (
                <SubMenu className="ds-container" key={program.key} title={program.team}>
                  {
                  program.datasets.sort((a,b) => a.title.localeCompare(b.title)).map((dataset) => (
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
                </SubMenu>
              );
            }
          )
        )}
      </SubMenu>
      {/*<SubMenu key="stats" title="My Stats" icon={<BarChartOutlined />}>
        <div style={{ padding: "20px", background: "#fff" }}></div>
          </SubMenu>*/}

      {auth.isAdmin() ? (
          <SubMenu key="stats" title="Reports" icon={<BarChartOutlined />}>
            <Menu.Item key="reports" role="menuitem">
              <Link to="/admin/reports">{t("admin.sidebar.reports")}</Link>
            </Menu.Item>
          </SubMenu>
      ) : ""}

      {auth.isAdmin() ? (
            <SubMenu 
            key="admin"
            title="Admin"
            icon={<SettingOutlined />}>            
            <Menu.Item key="users" role="menuitem">
              <Link to="/admin/users">{t("admin.sidebar.manageUsers")}</Link>
            </Menu.Item>
            <Menu.Item key="teams" role="menuitem">
              <Link to="/admin/teams">{t("admin.sidebar.manageTeams")}</Link>
            </Menu.Item>
            <Menu.Item key="programs" role="menuitem">
              <Link to="/admin/programs">{t("admin.sidebar.managePrograms")}</Link>
            </Menu.Item>
            
          </SubMenu>
      ) : ""}
    </Menu>
  );
};


/**
 * App sidebar content: info and navigation links
 */
const AppSidebar = (): JSX.Element => {
  return (
    <Sider width={300} className="sidebar" breakpoint="md" theme="dark" collapsible>

      <AppSidebarMenu />
      {/*auth.isAdmin() ? <AppAdminSidebarMenu /> : <AppNormalUserSidebarMenu />*/}
    </Sider>
  );
};

export { AppSidebar };
