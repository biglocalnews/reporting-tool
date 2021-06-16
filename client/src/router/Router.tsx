import React from "react";
import { Route, Switch, RouteComponentProps, Redirect } from "react-router-dom";
import { IRoute } from "./routes";
import { Auth } from "../services/auth";
import { useAuth } from "../components/AuthProvider";
import { LoginProps } from "../components/Login/Login";

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
 * Type representing a React component that can be used as a react-router component.
 *
 * The component can be either a classical or a functional component.
 */
type RouteComponentType = React.ComponentType<AnyRouteProps>;

/**
 * Require the user to be authenticated to view the given component.
 */
export const privateComponent = (auth: Auth, Component: RouteComponentType) => {
  return function protectedRoute(props: AnyRouteProps) {
    return auth.isLoggedIn() ? (
      <Component {...props} />
    ) : (
      <Redirect
        to={{
          pathname: "/login",
          state: { from: props.location },
        }}
      />
    );
  };
};

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
  protectedRoutes,
  protectedContainer,
}: RenderRoutesProps) {
  const auth = useAuth();
  const Container = protectedContainer;
  const WrappedPrivate = privateComponent(auth, (props: AnyRouteProps) => (
    <Container>
      <ProtectedRoutes routes={protectedRoutes} />
    </Container>
  ));

  return (
    <Switch>
      <Route exact path="/login" component={loginComponent} />
      <Route path="/" component={WrappedPrivate} />
    </Switch>
  );
}
