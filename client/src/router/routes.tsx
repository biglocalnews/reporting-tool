import React from "react";
import { Redirect, RouteComponentProps } from "react-router-dom";
import { BreadcrumbsRoute } from "use-react-router-breadcrumbs";
import { DataEntry } from "../components/DataEntry/DataEntry";
import { DatasetDetails } from "../components/DatasetDetails/DatasetDetails";
import { Home } from "../components/Home/Home";

interface SubRoute extends BreadcrumbsRoute {
  key?: string;
  exact?: boolean;
  component?: any;
}

export interface IRoute extends SubRoute {
  routes?: SubRoute[];
}

/**
 * Routes that are visible to every logged in user.
 */
export const normalRoutes: IRoute[] = [
  {
    path: "/dataset/:datasetId/entry/reload",
    exact: true,
    component: function redirect(
      props: RouteComponentProps<{ datasetId: string }>
    ) {
      return <Redirect to={`/dataset/${props.match.params.datasetId}/entry`} />;
    },
  },
  {
    path: "/",
    key: "home",
    exact: true,
    component: Home,
    breadcrumb: "Home",
  },
  {
    path: "/dataset/:datasetId/details",
    key: "dataset-details",
    component: DatasetDetails,
    breadcrumb: "Dataset Details",
    routes: [
      {
        path: "/dataset/:datasetId/entry",
        key: "add-entry",
        exact: true,
        component: DataEntry,
        breadcrumb: "Add Entry",
      },
      {
        path: "/dataset/:datasetId/entry/edit/:recordId",
        key: "edit-entry",
        exact: true,
        component: DataEntry,
        breadcrumb: "Edit Entry",
      },
    ],
  },
];

/**
 * Placeholder for development.
 * TODO: remove when we've built everything :)
 */
const Todo = (what: string) => {
  const TodoCmp = () => <div>TODO: {what}</div>;
  return TodoCmp;
};

/**
 * Routes that are only visible to admins.
 */
export const adminRoutes: IRoute[] = [
  {
    path: "/admin",
    key: "admin",
    routes: [
      {
        path: "/admin/users",
        key: "users",
        exact: true,
        component: Todo("manage users"),
        breadcrumb: "Manage users",
      },
      {
        path: "/admin/teams",
        key: "teams",
        exact: true,
        component: Todo("manage teams"),
        breadcrumb: "Manage teams",
      },
      {
        path: "/admin/programs",
        key: "programs",
        exact: true,
        component: Todo("manage programs"),
        breadcrumb: "Manage programs",
      },
    ],
  },
];
