import React from "react";
import "./AppHeader.css";
import logo from "../assets/5050logo.jpg";
import { Layout, Avatar, Col, Row } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

const { Header } = Layout;

export default class AppHeader extends React.Component {
  render() {
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
                  <p>Tina Turner</p>
                </span>
              </div>
            </Col>
          </Row>
        </Header>
        <div className="header__border-image"></div>
      </div>
    );
  }
}
