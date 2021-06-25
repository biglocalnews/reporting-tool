import React from "react";
import { Link } from "react-router-dom";
import { Breadcrumb } from "antd";
import { normalRoutes } from "../../router/routes";
import useBreadcrumbs from "use-react-router-breadcrumbs";

const BreadCrumb = () => {
  /**
   * DisableDefaults disables all routes in a path
   * that have not been set up in the router config
   * e.g. "/dataset/:id" will only create a breacrumb for
   * Home / Dataset Details and not Home / Dataset / Dataset Details
   * because a route for "/dataset" does not exist
   */
  const breadcrumbs = useBreadcrumbs(normalRoutes, { disableDefaults: true });
  return (
    <Breadcrumb style={{ marginBottom: 10 }}>
      {breadcrumbs.map(({ breadcrumb, match }) => (
        <Breadcrumb.Item key={match.url}>
          <Link to={match.url || ""}>{breadcrumb}</Link>
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  );
};

export default BreadCrumb;
