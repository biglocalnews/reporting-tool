import { Layout } from "antd";
import React, { Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import "./App.css";
import { Loading } from "./components/Loading/Loading";
import AppHeader from "./layout/AppHeader";
import { AppSidebar } from "./layout/AppSidebar";
import { Login } from "./pages/Login/Login";
import { RenderRoutes } from "./router/Router";
import { adminRoutes, normalRoutes } from "./router/routes";

const { Footer, Content } = Layout;

/**
 * Layout container for an authenticated user.
 */
export function ProtectedAppContainer({
  children,
}: {
  children?: React.ReactNode;
  crumbs?: boolean;
}) {
  return (
    <>
      <Layout>
        <AppSidebar />
        <Layout>
          <AppHeader />
          <Content className="site-layout-background">{children}</Content>
          <Footer></Footer>
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
            LoginComponent={Login}
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
