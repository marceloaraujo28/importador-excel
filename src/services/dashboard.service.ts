import type { DashboardConsolidadoResponse } from "../types/dashboard";

type GetDashboardConsolidadoParams = {
  dateFrom?: string;
  dateTo?: string;
  companyName?: string;
  groupName?: string;
};

export async function getDashboardConsolidado(
  params: GetDashboardConsolidadoParams = {},
): Promise<DashboardConsolidadoResponse> {
  const searchParams = new URLSearchParams();

  if (params.dateFrom) {
    searchParams.set("dateFrom", params.dateFrom);
  }

  if (params.dateTo) {
    searchParams.set("dateTo", params.dateTo);
  }

  if (params.companyName) {
    searchParams.set("companyName", params.companyName);
  }

  if (params.groupName) {
    searchParams.set("groupName", params.groupName);
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `http://localhost:3333/dashboard/consolidado?${queryString}`
    : "http://localhost:3333/dashboard/consolidado";

  const response = await fetch(url);

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Erro ao carregar dashboard");
  }

  return response.json();
}
