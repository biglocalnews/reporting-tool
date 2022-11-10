import { DownOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Col, Dropdown, Layout, Menu, Row } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { useConfig } from "../components/ConfigProvider";
import { getAssetUrl } from "../services/config";
import "./AppHeader.css";

const { Header } = Layout;

const AppHeader = () => {
  const auth = useAuth();
  const cfg = useConfig();

  const navigate = useNavigate();

  const logout = async () => {
    await auth.logout();
    navigate("/login");
  };

  const menu = (
    <Menu onClick={logout}>
      <Menu.Item key="1" icon={<LogoutOutlined />}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <div>
      <Header className="header">
        <Row wrap={false}>
          <Col flex="none">
            <div className="header__logo">
              <Link to="/">
                <img
                  src={getAssetUrl(cfg, "logo")}
                  alt={cfg.logo.alt}
                  style={{
                    width: cfg.logo.width,
                    height: cfg.logo.height,
                    marginRight: "20px",
                  }}
                />
              </Link>
            </div>
          </Col>
          <Col flex="auto">
            <div
              id="header__user"
              style={{ float: "right", lineHeight: "64px" }}
            >
              <Dropdown overlay={menu}>
                <Button icon={<UserOutlined />}>
                  {auth.getFullName()} <DownOutlined />
                </Button>
              </Dropdown>
            </div>
          </Col>
        </Row>
      </Header>
    </div>
  );
};

export default AppHeader;
