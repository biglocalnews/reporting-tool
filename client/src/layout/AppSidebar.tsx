import {
  BarChartOutlined,
  CaretLeftOutlined,
  CaretRightOutlined,
  DatabaseOutlined,
  HomeOutlined,
  SettingOutlined,
  TableOutlined,
  TeamOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { useQuery } from "@apollo/client";
import { Button, Layout, Menu } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { GetUser, GetUserVariables } from "../graphql/__generated__/getUser";
import { GET_USER } from "../graphql/__queries__/GetUser.gql";
import "./AppSidebar.css";
const { SubMenu } = Menu;
const { Sider } = Layout;

/**
 * Sidebar content for all users.
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
        <Menu.Item key="tags" icon={<TableOutlined />} role="menuitem">
          <Link to="/admin/tags">{t("admin.sidebar.manageTags")}</Link>
        </Menu.Item>
      </Menu.ItemGroup>
    </Menu>
  );
};

export const AppSidebarMenu = () => {
  const { t } = useTranslation();
  const userId = useAuth().getUserId();
  const auth = useAuth();
  const { data } = useQuery<GetUser, GetUserVariables>(GET_USER, {
    variables: { id: userId },
  });

  const sidebarTeams = data?.user?.teams.flatMap((team) => {
    return {
      key: team.id,
      name: team.name,
      programmes: team.programs.map((program) => {
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
      }),
    };
  });

  return (
    <Menu
      mode="inline"
      theme="dark"
      /*defaultOpenKeys={["admin"]}*/
      style={{ height: "100%", borderRight: 0, paddingTop: "10px" }}
    >
      <Menu.Item key="home" icon={<HomeOutlined />} role="menuitem">
        <Link to="/">{t("admin.sidebar.home")}</Link>
      </Menu.Item>
      {auth.isAdmin() && (
        <Menu.Item key="alldata" icon={<DatabaseOutlined />} role="menuitem">
          <Link to="/admin/datasets">{t("admin.sidebar.viewAll")}</Link>
        </Menu.Item>
      )}

      <SubMenu key="my-datasets" title="My Datasets" icon={<TeamOutlined />}>
        {sidebarTeams
          ?.flatMap((x) => x.programmes)
          .flatMap((x) => x.datasets)
          .map((dataset) => (
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

      <Menu.Item key="reports" role="menuitem" icon={<BarChartOutlined />}>
        <Link to="/reports">{t("admin.sidebar.reports")}</Link>
      </Menu.Item>

      {auth.isAdmin() && (
        <SubMenu key="admin" title="Admin" icon={<SettingOutlined />}>
          <Menu.Item key="users" role="menuitem">
            <Link to="/admin/users">{t("admin.sidebar.manageUsers")}</Link>
          </Menu.Item>
          <Menu.Item key="teams" role="menuitem">
            <Link to="/admin/teams">{t("admin.sidebar.manageTeams")}</Link>
          </Menu.Item>
          <Menu.Item key="programs" role="menuitem">
            <Link to="/admin/programs">
              {t("admin.sidebar.managePrograms")}
            </Link>
          </Menu.Item>
          <Menu.Item key="tags" role="menuitem">
            <Link to="/admin/tags">{t("admin.sidebar.manageTags")}</Link>
          </Menu.Item>
          <Menu.Item
            key="admin.reports"
            role="menuitem"
            icon={<BarChartOutlined />}
          >
            <Link to="/admin/reports">{t("admin.sidebar.reports")}</Link>
          </Menu.Item>
        </SubMenu>
      )}
    </Menu>
  );
};

interface IProps {
  setCollapseState: (newState: boolean) => void;
  collapsed: boolean;
}

/**
 * App sidebar content: info and navigation links
 */
const AppSidebar = ({ setCollapseState, collapsed }: IProps): JSX.Element => {
  return (
    <Sider
      collapsed={collapsed}
      width="var(--sidebarWidth)"
      className="sidebar"
      breakpoint="md"
      theme="dark"
      collapsible
      style={{
        overflow: "auto",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
      }}
      trigger={
        <Button
          type="text"
          style={{
            color: "var(--white)",
            fontSize: "1rem",
            width: "100%",
          }}
          onClick={() => setCollapseState(!collapsed)}
        >
          {collapsed ? <CaretRightOutlined /> : <CaretLeftOutlined />}
        </Button>
      }
    >
      <AppSidebarMenu />
    </Sider>
  );
};

export { AppSidebar };
