import React, { Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import { Layout } from "antd";
import AppHeader from "./layout/AppHeader";
import { AppSidebar } from "./layout/AppSidebar";
import "./App.css";
import ROUTES from "./router/routes";
import BreadCrumb from "./components/Breadcrumb/Breadcrumbs";
import { RenderRoutes } from "./router/Router";

const { Footer, Content } = Layout;

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<h1>Loading...</h1>}>
        <Layout style={{ height: "100vh" }}>
          <AppHeader />
          <Layout>
            <AppSidebar />
            <Layout style={{ padding: "0 24px 24px" }}>
              <Content className="site-layout-background">
                <BreadCrumb />
                <RenderRoutes routes={ROUTES} />
              </Content>
              <Footer style={{ textAlign: "center" }}>Footer content</Footer>
            </Layout>
          </Layout>
        </Layout>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
