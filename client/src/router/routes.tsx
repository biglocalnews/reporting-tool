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

const ROUTES: IRoute[] = [
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

export default ROUTES;
