import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { ErrorBoundary } from "../components/Error/ErrorBoundary";
import { VerifyAccount } from "../pages/VerifyAccount";
import { IRoute } from "./routes";

/**
 * Flatten routes to render components for a subroute
 */
function flattenRoutes(route: IRoute, agg: JSX.Element[] = []) {
  agg.push(
    <Route
      key={route.key}
      path={route.path}
      element={route.element}
    />
  );

  if (route.routes) {
    route.routes.forEach((r: IRoute) => flattenRoutes(r, agg));
  }

  return agg;
}


/**
 * List of routes defined as objects.
 */
export type RoutesList = IRoute[];

/**
 * Properties expected by the ProtectedRoutes component.
 */
export type ProtectedRoutesProps = {
  routes: RoutesList;
};

/**
 * Use this component for any new section of routes
 * (any config object that has a "routes" property
 */
export const ProtectedRoutes = ({ routes }: ProtectedRoutesProps) =>
  <Routes>
    {
      routes &&
      routes.map((route: IRoute) => {
        return flattenRoutes(route);
      })
    }
    <Route element={<h1>Not Found!</h1>} />
  </Routes>

/**
 * Properties expected by the RenderRoutes component.
 */
export type RenderRoutesProps = {
  LoginComponent: React.ComponentType;
  adminRoutes: RoutesList;
  protectedRoutes: RoutesList;
  protectedContainer: React.ComponentType;
};

function Redirecter(props: { from: string }) {
  useEffect(() => {
    console.log(props.from);
    window.location.href = `/api/bbc-login`;
  });
  return <React.Fragment />;
}

/**
 * Component to render the react router DOM.
 *
 * The router consists of two parts. At the outer level is the login router,
 * which will redirect the user to the provided Login component if they are not
 * authenticated. Once the user is authed, they will have access to the list
 * of protected routes passed in here.
 */
export function RenderRoutes({
  LoginComponent,
  adminRoutes,
  protectedRoutes,
  protectedContainer,
}: RenderRoutesProps) {
  const { t } = useTranslation();
  const auth = useAuth();
  const Container = protectedContainer;

  // First time login requires the user to configure the app.
  if (auth.isBlankSlate()) {
    return (
      <Routes>
        <Route
          path="/"
          element={React.lazy(() => import("../pages/Configure"))}
        />
      </Routes>
    );
  }

  // Routes that a normal authed user can visit.
  // If the user is not logged in, they will be redirected to the login screen.
  const WrappedPrivate = () => {
    const location = useLocation();
    if (!auth.isLoggedIn()) {
      if (process.env.NODE_ENV !== "production") {
        return <Navigate to="/login" state={{ from: location }} />
      }
      return <Redirecter from={location.pathname} />
    }
    return <Container>

      <ErrorBoundary>
        <ProtectedRoutes routes={protectedRoutes} />
      </ErrorBoundary>
    </Container>

  }
  // Additional routes that only authed admins can visit.
  // When a user is logged in but lacks permission, they will see an error
  // telling them that they can't view the requested site.
  //
  // If a user is *not* logged in, they will be redirected to login screen.
  const WrappedPrivateAdmin = () => {
    const location = useLocation();
    if (!auth.isLoggedIn()) {
      if (process.env.NODE_ENV !== "production") {
        return <Navigate to="/login" state={{ from: location }} />
      }
      return <Redirecter from={location.pathname} />
    }
    return <Container>
      <ErrorBoundary>
        {auth.isAdmin() ? (
          <ProtectedRoutes routes={adminRoutes} />
        ) : (
          <div>{t("notAuthorized")}</div>
        )}
      </ErrorBoundary>
    </Container>
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginComponent />} />
      <Route path="/account/verify" element={<VerifyAccount />} />
      <Route
        path="/account/reset-password"
        element={React.lazy(
          () => import("../pages/ResetAccountPassword/ResetAccountPassword")
        )}
      />
      <Route path="/admin/*" element={<WrappedPrivateAdmin />} />
      <Route path="/*" element={<WrappedPrivate />} />
    </Routes>
  );
}
