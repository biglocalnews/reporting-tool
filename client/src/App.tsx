import { Empty, Layout } from "antd";
import { Suspense, useEffect } from "react";
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
const { Footer, Content } = Layout;

/**
 * Layout container for an authenticated user.
 */
const ProtectedAppContainer: React.FC = ({ children }) => <Layout>
  <AppSidebar />
  <Layout>
    <AppHeader />
    <Content className="site-layout-background">
      {children}
    </Content>
    <Footer></Footer>
  </Layout>
</Layout>

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

/**
 * Top-level app layout.
 */
function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Layout style={{ height: "100vh" }}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<WrappedPrivate />}>
              <Route index element={<Home />} />
              <Route path="dataset/:datasetId/details" element={<DatasetDetails />} />
              <Route path="dataset/:datasetId/entry" element={<DataEntry />} />
              <Route path="dataset/:datasetId/entry/edit/:recordId" element={<DataEntry />} />
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
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </Layout>
    </Suspense>
  );
}

export default App;
