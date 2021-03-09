import React, { Suspense } from "react";
import "./App.css";
import { Layout } from "antd";
import AppHeader from "./components/AppHeader";
import AppSidebar from "./components/AppSidebar";

const { Footer, Content } = Layout;

function App() {
  return (
    <Suspense fallback={<h1>Loading profile...</h1>}>
      <Layout style={{ height: "100vh" }}>
        <AppHeader />
        <Layout>
          <AppSidebar />
          <Layout style={{ padding: "0 24px 24px" }}>
            <Content
              className="site-layout-background"
              style={{
                padding: 24,
                marginTop: 24,
                minHeight: 280,
              }}
            ></Content>
            <Footer style={{ textAlign: "center" }}>Footer content</Footer>
          </Layout>
        </Layout>
      </Layout>
    </Suspense>
  );
}

export default App;
