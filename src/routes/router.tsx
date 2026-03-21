import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/layout/Layout";
import DashboardPage from "../pages/dashboard/DashboardPage";
import ExtratosPage from "../pages/extratos/ExtratosPage";
import ImportarExtratosPage from "../pages/extratos/ImportarExtratosPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "extratos",
        element: <ExtratosPage />,
      },
      {
        path: "extratos/importar",
        element: <ImportarExtratosPage />,
      },
    ],
  },
]);
