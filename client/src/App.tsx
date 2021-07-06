import React, { Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import { Layout } from "antd";
import AppHeader from "./layout/AppHeader";
import { AppSidebar } from "./layout/AppSidebar";
import "./App.css";
import BreadCrumb from "./components/Breadcrumb/Breadcrumbs";
import { Login } from "./pages/Login/Login";
import { Loading } from "./components/Loading/Loading";

import { normalRoutes, adminRoutes } from "./router/routes";
import { RenderRoutes } from "./router/Router";

const { Footer, Content } = Layout;

/**
 * Layout container for an authenticated user.
 */
export function ProtectedAppContainer({
  children,
}: {
  children?: React.ReactNode;
}) {
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
      <Suspense fallback={<Loading />}>
        <Layout style={{ height: "100vh" }}>
          <RenderRoutes
            loginComponent={Login}
            adminRoutes={adminRoutes}
            protectedRoutes={normalRoutes}
            protectedContainer={ProtectedAppContainer}
          />
        </Layout>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
