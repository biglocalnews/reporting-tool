import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Button, Col, Layout, Row } from "antd";
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
              <span id="avatar" className="header__user-profile-item">
                <Avatar
                  style={{ backgroundColor: "#87d068" }}
                  icon={<UserOutlined />}
                />
              </span>
              <span id="name" className="header__user-profile-item">
                <p>{auth.getFullName()}</p>
              </span>
              <span className="header__user-profile-item">
                <Button
                  shape="circle"
                  icon={<LogoutOutlined />}
                  onClick={logout}
                />
              </span>
            </div>
          </Col>
        </Row>
      </Header>
    </div>
  );
};

export default AppHeader;
