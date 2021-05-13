import React from "react";
import { Route, Switch } from "react-router-dom";

/**
 * Flatten routes to render components for a subroute
 */
function flattenRoutes(route: any, agg: any = []) {
  agg.push(
    <Route
      exact
      key={route.key}
      path={route.path}
      component={route.component}
    />
  );

  if (route.routes) {
    route.routes.forEach((r: any) => flattenRoutes(r, agg));
  }

  return agg;
}

/**
 * Use this component for any new section of routes
 * (any config object that has a "routes" property
 */
export function RenderRoutes({ routes }: any) {
  return (
    <Switch>
      {routes &&
        routes.map((route: any) => {
          return flattenRoutes(route);
        })}
      <Route component={() => <h1>Not Found!</h1>} />
    </Switch>
  );
}
