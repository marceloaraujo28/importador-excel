import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/layout/Layout";
import DashboardPage from "../pages/dashboard/DashboardPage";
import ExtratosPage from "../pages/extratos/ExtratosPage";
import ImportarExtratosPage from "../pages/extratos/ImportarExtratosPage";
import NovoLancamentoExtratoPage from "../pages/extratos/NovoLancamentoExtratoPage";
import RevisaoExtratosPage from "../pages/extratos/RevisaoExtratosPage";
import OpeningBalancesPage from "../pages/balances/OpeningBalancesPage";
import ManualConsolidadoPage from "../pages/manual-consolidado/ManualConsolidadoPage";
import ManualConsolidadoFormPage from "../pages/manual-consolidado/ManualConsolidadoFormPage";

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
      {
        path: "extratos/novo",
        element: <NovoLancamentoExtratoPage />,
      },
      {
        path: "/extratos/revisao",
        element: <RevisaoExtratosPage />,
      },
      {
        path: "saldos-iniciais",
        element: <OpeningBalancesPage />,
      },
      {
        path: "consolidado-manual",
        element: <ManualConsolidadoPage />,
      },
      {
        path: "consolidado-manual/novo",
        element: <ManualConsolidadoFormPage />,
      },
      {
        path: "consolidado-manual/:id/editar",
        element: <ManualConsolidadoFormPage />,
      },
    ],
  },
]);
