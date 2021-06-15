import React, { Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import { Layout } from "antd";
import AppHeader from "./layout/AppHeader";
import { AppSidebar } from "./layout/AppSidebar";
import "./App.css";
import BreadCrumb from "./components/Breadcrumb/Breadcrumbs";
import { Login } from "./components/Login/Login";

import ROUTES from "./router/routes";
import { RenderRoutes } from "./router/Router";

import { auth } from "./services/auth";

const { Footer, Content } = Layout;

/**
 * Layout container for an authenticated user.
 */
function ProtectedAppContainer({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <Layout>
        <AppSidebar />
        <Layout style={{ padding: "0 24px 24px" }}>
          <Content className="site-layout-background">
            <BreadCrumb />
            {children}
          </Content>
          <Footer style={{ textAlign: "center" }}>Footer content</Footer>
        </Layout>
      </Layout>
    </>
  );
}

/**
 * Top-level app layout.
 */
function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<h1>Loading...</h1>}>
        <Layout style={{ height: "100vh" }}>
          <RenderRoutes
            auth={auth}
            loginComponent={Login}
            protectedRoutes={ROUTES}
            protectedContainer={ProtectedAppContainer}
          />
        </Layout>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
