import React, { Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import { Layout } from "antd";
import AppHeader from "./layout/AppHeader";
import { AppSidebar } from "./layout/AppSidebar";
import "./App.css";
import BreadCrumb from "./components/Breadcrumb/Breadcrumbs";
import { Login } from "./components/Login/Login";
import { Loading } from "./components/Loading/Loading";

import ROUTES from "./router/routes";
import { RenderRoutes } from "./router/Router";

import { useAuth } from "./components/AuthProvider";

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
  const auth = useAuth();
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
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
