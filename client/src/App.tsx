import {
  GithubOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { Button, Divider, Empty, Layout } from "antd";
import React, { Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import "./App.css";
import { useAuth } from "./components/AuthProvider";
import { useConfig } from "./components/ConfigProvider";
import { ErrorBoundary } from "./components/Error/ErrorBoundary";
import { Loading } from "./components/Loading/Loading";
import AppHeader from "./layout/AppHeader";
import { AppSidebar } from "./layout/AppSidebar";
import { AdminReports } from "./pages/Admin/AdminReports";
import { EditProgram } from "./pages/Admin/EditProgram";
import { EditTags } from "./pages/Admin/EditTags";
import { EditTeam } from "./pages/Admin/EditTeam";
import { EditUser } from "./pages/Admin/EditUser";
import { ProgramList } from "./pages/Admin/ProgramList";
import { TeamList } from "./pages/Admin/TeamList";
import { UserList } from "./pages/Admin/UserList";
import { DataEntry } from "./pages/DataEntry/DataEntry";
import { DatasetDetails } from "./pages/DatasetDetails/DatasetDetails";
import { Datasets } from "./pages/Datasets/Datasets";
import { Home } from "./pages/Home/Home";
import { Login } from "./pages/Login/Login";
import { Reports } from "./pages/Reports/Reports";
const { Footer, Content } = Layout;

const NotFound = () => {
  const { t } = useTranslation();
  return (
    <div
      style={{
        display: "inline-flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
      }}
    >
      <Empty description={<span>{t("pageNotFound")}</span>}></Empty>
    </div>
  );
};

export const footerHeight = "48px";

/**
 * Top-level app layout.
 */
function App() {
  const [sidebarCollapsed, setSidebarCollapse] = useState(false);

  const { t } = useTranslation();
  const cfg = useConfig();
  const sidebarDim = sidebarCollapsed
    ? "var(--sidebarCollapsedWidth)"
    : "var(--sidebarWidth)";
  /**
   * Layout container for an authenticated user.
   */
  const ProtectedAppContainer: React.FC = ({ children }) => (
    <Layout hasSider>
      <AppSidebar
        setCollapseState={setSidebarCollapse}
        collapsed={sidebarCollapsed}
      />
      <Layout
        style={{
          background: "var(--background)",
          marginLeft: sidebarDim,
          overflowY: "auto",
          overflowX: "auto",
          height: `calc(100vh - ${footerHeight})`,
          width: `calc(100vw - ${sidebarDim}`,
        }}
      >
        <AppHeader />
        <Divider
          style={{
            margin: 0,
            borderTop: "var(--dividerSize) solid var(--lightAccent)",
          }}
        />
        <Content
          style={{
            padding: "20px",
            height: "auto",
            width: "100%",
          }}
        >
          {children}
        </Content>
        <Footer
          style={{
            padding: "1rem",
            height: footerHeight,
            textAlign: "left",
            position: "fixed",
            zIndex: 1,
            bottom: 0,
            boxShadow: "var(--footerShadow)",
            width: `calc(100vw - ${sidebarDim}`,
            background: "var(--darkBlue)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Button
            type="link"
            href="https://github.com/stanford-policylab/bbc-50-50/graphs/contributors"
          >
            <span
              style={{
                fontFamily: "monospace",
                color: "var(--cyberText)",
              }}
            >
              &gt;_&nbsp;{t("footer")}
            </span>
          </Button>

          <div style={{ flexGrow: 1 }} />

          <Button
            type="link"
            href="https://github.com/stanford-policylab/bbc-50-50/blob/main/README.md"
            icon={<InfoCircleOutlined />}
            style={{
              color: "var(--lightText)",
            }}
          >
            {t("userGuide")}
          </Button>
          <Button
            type="link"
            href="https://github.com/stanford-policylab/bbc-50-50"
            icon={<GithubOutlined />}
            style={{
              color: "var(--lightText)",
            }}
          >
            v1.0
          </Button>
          <Button
            type="link"
            href={`mailto:${cfg.help_email}`}
            icon={<QuestionCircleOutlined />}
            style={{
              color: "var(--lightText)",
            }}
          >
            Help
          </Button>
        </Footer>
      </Layout>
    </Layout>
  );

  // Additional routes that only authed admins can visit.
  // When a user is logged in but lacks permission, they will see an error
  // telling them that they can't view the requested site.
  //
  // If a user is *not* logged in, they will be redirected to login screen.
  const WrappedPrivateAdmin = () => {
    const location = useLocation();
    const auth = useAuth();
    const { t } = useTranslation();
    if (!auth.isLoggedIn()) {
      return <Navigate to={cfg.sso_url} state={{ from: location }} />;
    }
    return (
      <ProtectedAppContainer>
        <ErrorBoundary>
          {auth.isAdmin() ? <Outlet /> : <div>{t("notAuthorized")}</div>}
        </ErrorBoundary>
      </ProtectedAppContainer>
    );
  };

  // Routes that a normal authed user can visit.
  // If the user is not logged in, they will be redirected to the login screen.
  const WrappedPrivate = () => {
    const location = useLocation();
    const auth = useAuth();
    if (!auth.isLoggedIn()) {
      return <Navigate to={cfg.sso_url} state={{ from: location }} />;
    }
    return (
      <ProtectedAppContainer>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </ProtectedAppContainer>
    );
  };

  const AnalyticsWrapper: React.FC = ({ children }) => {
    const location = useLocation();

    useEffect(() => {
      console.log(`[TODO] No analytics currently configured for ${location}`);
    }, [location]);

    return <>{children}</>;
  };

  return (
    <Suspense fallback={<Loading />}>
      <BrowserRouter>
        <AnalyticsWrapper>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<WrappedPrivate />}>
              <Route index element={<Home />} />
              <Route
                path="dataset/:datasetId/details"
                element={<DatasetDetails />}
              />
              <Route path="dataset/:datasetId/entry" element={<DataEntry />} />
              <Route
                path="dataset/:datasetId/entry/edit/:recordId"
                element={<DataEntry />}
              />
              <Route path="reports" element={<Reports />} />
            </Route>
            <Route path="/admin/" element={<WrappedPrivateAdmin />}>
              <Route path="users" element={<UserList />} />
              <Route path="users/:userId" element={<EditUser />} />
              <Route path="teams" element={<TeamList />} />
              <Route path="teams/:teamId" element={<EditTeam />} />
              <Route path="programs" element={<ProgramList />} />
              <Route path="programs/:programId" element={<EditProgram />} />
              <Route path="tags" element={<EditTags />} />
              <Route path="datasets" element={<Datasets />} />
              <Route path="reports" element={<AdminReports />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnalyticsWrapper>
      </BrowserRouter>
    </Suspense>
  );
}

export default App;
