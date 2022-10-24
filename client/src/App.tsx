import { Button, Divider, Empty, Layout } from "antd";
import { Suspense, useEffect, useState, useRef } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import { ErrorBoundary } from "./components/Error/ErrorBoundary";
import { Loading } from "./components/Loading/Loading";
import AppHeader from "./layout/AppHeader";
import { AppSidebar } from "./layout/AppSidebar";
import { EditProgram } from "./pages/Admin/EditProgram";
import { EditTags } from "./pages/Admin/EditTags";
import { EditTeam } from "./pages/Admin/EditTeam";
import { EditUser } from "./pages/Admin/EditUser";
import { ProgramList } from "./pages/Admin/ProgramList";
import { TeamList } from "./pages/Admin/TeamList";
import { UserList } from "./pages/Admin/UserList";
import { DataEntry } from "./pages/DataEntry/DataEntry";
import { DatasetDetails } from "./pages/DatasetDetails/DatasetDetails";
import { Login } from "./pages/Login/Login";
import { useAuth } from "./components/AuthProvider";
import React from "react";
import { useTranslation } from "react-i18next";
import { Home } from "./pages/Home/Home";
import { Datasets } from "./pages/Datasets/Datasets";
import { Reports } from "./pages/Reports/Reports";
import { AdminReports } from "./pages/Admin/AdminReports";
const { Footer, Content } = Layout;
import { InfoCircleOutlined, ProjectOutlined, GithubOutlined, TeamOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { ConfigKeys, Enums, EchoClient } from '@bbc/echo-client-js';



function Redirecter(props: { from: string }) {
  useEffect(() => {
    console.log(props.from);
    window.location.href = `/api/bbc-login`;
  });
  return <React.Fragment />;
}

const NotFound = () => {
  const { t } = useTranslation();
  return <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', height: "100%" }}>
    <Empty
      description={
        <span>{t("pageNotFound")}</span>
      }
    >
    </Empty>
  </div>
}

export const footerHeight = "48px";

/**
 * Top-level app layout.
 */
function App() {
  const [sidebarCollapsed, setSidebarCollapse] = useState(false);


  const { t } = useTranslation();
  /**
 * Layout container for an authenticated user.
 */
  const ProtectedAppContainer: React.FC = ({ children }) =>
    <Layout hasSider>
      <AppSidebar setCollapseState={setSidebarCollapse} collapsed={sidebarCollapsed} />
      <Layout
        style={{
          background: "#fff",
          marginLeft: sidebarCollapsed ? 80 : 300,
          overflowY: "auto",
          overflowX: "auto",
          height: `calc(100vh - ${footerHeight})`,
          width: `calc(100vw - ${sidebarCollapsed ? 80 : 300}px`,
        }}
      >
        <AppHeader />
        <Divider style={{ margin: 0, borderTop: "15px solid #f0f2f5" }} />
        <Content
          style={{
            padding: "20px",
            height: "auto",
            width: "100%"
          }}
        >
          {children}
        </Content>
        <Footer
          style={{
            padding: "14px",
            height: footerHeight,
            textAlign: 'left',
            position: 'fixed',
            zIndex: 1,
            bottom: 0,
            boxShadow: "0.5em 0.5em 0.5em rgba(0,0,50,0.6)",
            width: `calc(100vw - ${sidebarCollapsed ? 80 : 300}px`,
            background: "#002140",
            display: "flex",
            alignItems: "center"

          }}
        >

          <Button
            type="link"
            href="https://staff.bbc.com/gateway/northern-ireland/ni-staff-tech-tools/"
            style={{
              color: "white"
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                color: "#33FF33"
              }}
            >
              &gt;_&nbsp;{t("footer")}
            </span>
          </Button>

          <div style={{ flexGrow: 1 }} />

          <Button
            type="link"
            href="https://50-50.esyscloud.io/Contributors/"
            icon={<TeamOutlined />}
            style={{
              color: "white"
            }}
          >
            Contributors Database
          </Button>

          <Button
            type="link"
            href="https://staff.bbc.com/gateway/northern-ireland/documents/5050-tracker-user-guide-quick-start-09.pdf"
            icon={<InfoCircleOutlined />}
            style={{
              color: "white"
            }}
          >
            {t("userGuide")}
          </Button>
          <Button
            type="link"
            href="https://confluence.dev.bbc.co.uk/display/NIPRODOPS/BBC+50%3A50+Portal"
            icon={<ProjectOutlined />}
            style={{
              color: "white"
            }}
          >
            {t("project")}
          </Button>
          <Button
            type="link"
            href="https://github.com/BBCNI/bbc-50-50"
            icon={<GithubOutlined />}
            style={{
              color: "white"
            }}
          >
            v1.0
          </Button>
          <Button
            type="link"
            href="mailto:5050portalhelp@bbc.co.uk"
            icon={<QuestionCircleOutlined />}
            style={{
              color: "white"
            }}
          >
            Help
          </Button>


        </Footer>
      </Layout>
    </Layout >

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
      if (process.env.NODE_ENV !== "production") {
        return <Navigate to="/login" state={{ from: location }} />
      }
      return <Redirecter from={location.pathname} />
    }
    return <ProtectedAppContainer>
      <ErrorBoundary>
        {auth.isAdmin() ? (
          <Outlet />
        ) : (
          <div>{t("notAuthorized")}</div>
        )}
      </ErrorBoundary>
    </ProtectedAppContainer>
  }



  // Routes that a normal authed user can visit.
  // If the user is not logged in, they will be redirected to the login screen.
  const WrappedPrivate = () => {
    const location = useLocation();
    const auth = useAuth();
    if (!auth.isLoggedIn()) {
      if (process.env.NODE_ENV !== "production") {
        return <Navigate to="/login" state={{ from: location }} />
      }
      return <Redirecter from={location.pathname} />
    }
    return <ProtectedAppContainer>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </ProtectedAppContainer>

  }

  const AnalyticsWrapper: React.FC = ({ children }) => {
    const echo = useRef<EchoClient | undefined>();
    const location = useLocation();

    useEffect(() => {
      if (!echo.current) {
        const conf = {};
        conf[ConfigKeys.DESTINATION] = Enums.Destinations.GATEWAY_TEST;
        conf[ConfigKeys.PRODUCER] = Enums.Producers.NORTHERN_IRELAND;
        const echoClient = new EchoClient('5050', Enums.ApplicationType.WEB, conf, null, () => {
          echoClient.viewEvent(`bbcni.5050.${location.pathname}.page`);
          echo.current = echoClient;
        });
        return;
      }
      echo.current.viewEvent(`bbcni.5050.${location.pathname}.page`);

    }, [location]);

    return <>
      {children}
    </>

  }


  return (
    <Suspense fallback={<Loading />}>
      <BrowserRouter>
        <AnalyticsWrapper>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<WrappedPrivate />}>
              <Route index element={<Home />} />
              <Route path="dataset/:datasetId/details" element={<DatasetDetails />} />
              <Route path="dataset/:datasetId/entry" element={<DataEntry />} />
              <Route path="dataset/:datasetId/entry/edit/:recordId" element={<DataEntry />} />
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
