import React from "react";
import { Route, Switch, RouteComponentProps, Redirect } from "react-router-dom";
import { VerifyAccount } from "../pages/VerifyAccount";
import { IRoute } from "./routes";
import { Auth } from "../services/auth";
import { useAuth } from "../components/AuthProvider";
import { ErrorBoundary } from "../components/Error/ErrorBoundary";
import { ResetAccountPassword } from "../pages/ResetAccountPassword/ResetAccountPassword";
import { LoginProps } from "../pages/Login/Login";
import { useTranslation } from "react-i18next";

/**
 * Flatten routes to render components for a subroute
 */
function flattenRoutes(route: IRoute, agg: any = []) {
  agg.push(
    <Route
      exact
      key={route.key}
      path={route.path}
      component={route.component}
    />
  );

  if (route.routes) {
    route.routes.forEach((r: IRoute) => flattenRoutes(r, agg));
  }

  return agg;
}

/**
 * Type representing the base router props.
 */
type AnyRouteProps = RouteComponentProps<Record<string, string | undefined>>;

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
export function ProtectedRoutes({ routes }: ProtectedRoutesProps) {
  return (
    <Switch>
      {routes &&
        routes.map((route: IRoute) => {
          return flattenRoutes(route);
        })}
      <Route component={() => <h1>Not Found!</h1>} />
    </Switch>
  );
}

/**
 * Properties expected by the RenderRoutes component.
 */
export type RenderRoutesProps = {
  loginComponent: React.ComponentType<LoginProps>;
  adminRoutes: RoutesList;
  protectedRoutes: RoutesList;
  protectedContainer: React.ComponentType;
};

/**
 * Component to render the react router DOM.
 *
 * The router consists of two parts. At the outer level is the login router,
 * which will redirect the user to the provided Login component if they are not
 * authenticated. Once the user is authed, they will have access to the list
 * of protected routes passed in here.
 */
export function RenderRoutes({
  loginComponent,
  adminRoutes,
  protectedRoutes,
  protectedContainer,
}: RenderRoutesProps) {
  const { t } = useTranslation();
  const auth = useAuth();
  const Container = protectedContainer;

  // Routes that a normal authed user can visit.
  // If the user is not logged in, they will be redirected to the login screen.
  const WrappedPrivate = (props: AnyRouteProps) =>
    auth.isLoggedIn() ? (
      <Container>
        <ProtectedRoutes routes={protectedRoutes} />
      </Container>
    ) : (
      <Redirect
        to={{
          pathname: "/login",
          state: { from: props.location },
        }}
      />
    );

  // Additional routes that only authed admins can visit.
  // When a user is logged in but lacks permission, they will see an error
  // telling them that they can't view the requested site.
  //
  // If a user is *not* logged in, they will be redirected to login screen.
  const WrappedPrivateAdmin = (props: AnyRouteProps) =>
    auth.isLoggedIn() ? (
      <Container>
        <ErrorBoundary>
          {auth.isAdmin() ? (
            <ProtectedRoutes routes={adminRoutes} />
          ) : (
            <div>{t("notAuthorized")}</div>
          )}
        </ErrorBoundary>
      </Container>
    ) : (
      <Redirect to={{ pathname: "/login", state: { from: props.location } }} />
    );

  return (
    <Switch>
      <Route exact path="/login" component={loginComponent} />
      <Route exact path="/account/verify" component={VerifyAccount} />
      <Route
        exact
        path="/account/reset-password"
        component={ResetAccountPassword}
      />
      <Route path="/admin/" component={WrappedPrivateAdmin} />
      <Route path="/" component={WrappedPrivate} />
    </Switch>
  );
}
