import React from "react";
import "./AppHeader.css";
import logo from "../assets/5050logo.jpg";
import { Menu, Layout, Avatar, Col, Row } from "antd";
import { UserOutlined } from "@ant-design/icons";

const { Header } = Layout;

export default class AppHeader extends React.Component {
  render() {
    return (
      <div>
        <Header className="header">
          <Row wrap={false}>
            <Col flex="none">
              <div className="header__logo">
                <img src={logo} alt="App logo" />
              </div>
            </Col>
            <Col flex="auto">
              <Menu
                theme="light"
                mode="horizontal"
                style={{ float: "right", lineHeight: "64px" }}
              >
                <Menu.Item
                  disabled
                  key="userProfileImage"
                  className="header__user-profile-item"
                >
                  <Avatar
                    size="large"
                    style={{ backgroundColor: "#87d068" }}
                    icon={<UserOutlined />}
                  />
                </Menu.Item>
                <Menu.Item
                  disabled
                  key="userProfileName"
                  className="header__user-profile-item"
                >
                  <h5>Tina Turner</h5>
                </Menu.Item>
              </Menu>
            </Col>
          </Row>
        </Header>
        <div className="header__border-image"></div>
      </div>
    );
  }
}
