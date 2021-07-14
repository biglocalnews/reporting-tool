import { Redirect, RouteComponentProps } from "react-router-dom";
import { BreadcrumbsRoute } from "use-react-router-breadcrumbs";
import { EditProgram } from "../pages/Admin/EditProgram";
import { EditTeam } from "../pages/Admin/EditTeam";
import { EditUser } from "../pages/Admin/EditUser";
import { ProgramList } from "../pages/Admin/ProgramList";
import { TeamList } from "../pages/Admin/TeamList";
import { UserList } from "../pages/Admin/UserList";
import { DataEntry } from "../pages/DataEntry/DataEntry";
import { DatasetDetails } from "../pages/DatasetDetails/DatasetDetails";
import { Home } from "../pages/Home/Home";

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
        component: UserList,
        breadcrumb: "Manage Users",
      },
      {
        path: "/admin/users/:userId",
        key: "user",
        exact: true,
        component: EditUser,
        breadcrumb: "Edit User",
      },
      {
        path: "/admin/teams",
        key: "teams",
        exact: true,
        component: TeamList,
        breadcrumb: "Manage Teams",
      },
      {
        path: "/admin/teams/:teamId",
        key: "team",
        exact: true,
        component: EditTeam,
        breadcrumb: "Edit Team",
      },
      {
        path: "/admin/programs",
        key: "programs",
        exact: true,
        component: ProgramList,
      },
      {
        path: "/admin/programs/:programId",
        key: "program",
        exact: true,
        component: EditProgram,
      },
    ],
  },
];
