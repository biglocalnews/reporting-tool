import { LogoutOutlined, DownOutlined, UserOutlined } from "@ant-design/icons";
import { Menu, Dropdown, Button, Col, Layout, Row } from "antd";
import { Link, useHistory } from "react-router-dom";
import logo from "../assets/5050logo.jpg";
import { useAuth } from "../components/AuthProvider";

import "./AppHeader.css";

const { Header } = Layout;

const AppHeader = () => {
  const auth = useAuth();

  const history = useHistory();

  const logout = async () => {
    await auth.logout();
    history.push("/login");
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
                <img src={logo} alt="App logo" />
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
