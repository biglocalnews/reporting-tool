import { Navigate, useParams } from "react-router-dom";
import { BreadcrumbsRoute } from "use-react-router-breadcrumbs";
import { EditProgram } from "../pages/Admin/EditProgram";
import { EditTags } from "../pages/Admin/EditTags";
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
  element?: JSX.Element;
}

export interface IRoute extends SubRoute {
  routes?: SubRoute[];
}

function Redirect(): JSX.Element {
  const params = useParams();
  return <Navigate to={`/dataset/${params.datasetId}/entry`} />
}

/**
 * Routes that are visible to every logged in user.
 */
export const normalRoutes: IRoute[] = [
  {
    path: "/dataset/:datasetId/entry/reload",
    exact: true,
    element: <Redirect />
  },
  {
    path: "/",
    key: "home",
    exact: true,
    element: <Home />,
    breadcrumb: "Home",
  },
  {
    path: "/dataset/:datasetId/details",
    key: "dataset-details",
    element: <DatasetDetails />,
    breadcrumb: "Dataset Details",
    routes: [
      {
        path: "/dataset/:datasetId/entry",
        key: "add-entry",
        exact: true,
        element: <DataEntry />,
        breadcrumb: "Add Entry",
      },
      {
        path: "/dataset/:datasetId/entry/edit/:recordId",
        key: "edit-entry",
        exact: true,
        element: <DataEntry />,
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
        element: <UserList />,
        breadcrumb: "Manage Users",
      },
      {
        path: "/admin/users/:userId",
        key: "user",
        exact: true,
        element: <EditUser />,
        breadcrumb: "Edit User",
      },
      {
        path: "/admin/teams",
        key: "teams",
        exact: true,
        element: <TeamList />,
        breadcrumb: "Manage Teams",
      },
      {
        path: "/admin/teams/:teamId",
        key: "team",
        exact: true,
        element: <EditTeam />,
        breadcrumb: "Edit Team",
      },
      {
        path: "/admin/programs",
        key: "programs",
        exact: true,
        element: <ProgramList />,
      },
      {
        path: "/admin/programs/:programId",
        key: "program",
        exact: true,
        element: <EditProgram />,
      },
      {
        path: "/admin/tags",
        key: "tags",
        exact: true,
        element: <EditTags />,
      },
    ],
  },
];
