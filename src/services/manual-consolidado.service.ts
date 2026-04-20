import type {
  CreateManualConsolidadoEntryPayload,
  DeleteManualConsolidadoEntryResponse,
  ManualConsolidadoDashboardResponse,
  ManualConsolidadoEntriesResponse,
  ManualConsolidadoEntryFilters,
  ManualConsolidadoEntryResponse,
  UpdateManualConsolidadoEntryPayload,
} from "../types/manual-consolidado";

const BASE_URL = "http://localhost:3333";

export async function getManualConsolidadoDashboard(params: {
  accountIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  status?: "AUTORIZADO" | "NAO_AUTORIZADO" | "TODOS";
} = {}): Promise<ManualConsolidadoDashboardResponse> {
  const searchParams = new URLSearchParams();

  if (params.accountIds?.length) {
    for (const accountId of params.accountIds) {
      searchParams.append("accountId", accountId);
    }
  }

  if (params.dateFrom) {
    searchParams.set("dateFrom", params.dateFrom);
  }

  if (params.dateTo) {
    searchParams.set("dateTo", params.dateTo);
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `${BASE_URL}/consolidado-manual/resumo?${queryString}`
    : `${BASE_URL}/consolidado-manual/resumo`;

  const response = await fetch(url);

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      data?.error ?? "Erro ao carregar resumo do consolidado manual",
    );
  }

  return response.json();
}

export async function listManualConsolidadoEntries(
  params: ManualConsolidadoEntryFilters = {},
): Promise<ManualConsolidadoEntriesResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set("page", String(params.page));
  }

  if (params.pageSize) {
    searchParams.set("pageSize", String(params.pageSize));
  }

  if (params.accountIds?.length) {
    for (const accountId of params.accountIds) {
      searchParams.append("accountId", accountId);
    }
  }

  if (params.dateFrom) {
    searchParams.set("dateFrom", params.dateFrom);
  }

  if (params.dateTo) {
    searchParams.set("dateTo", params.dateTo);
  }

  if (params.dateOrder) {
    searchParams.set("dateOrder", params.dateOrder);
  }

  if (params.amount !== undefined) {
    searchParams.set("amount", String(params.amount));
  }

  if (params.description) {
    searchParams.set("description", params.description);
  }

  if (params.assignment?.length) {
    for (const assignment of params.assignment) {
      searchParams.append("assignment", assignment);
    }
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `${BASE_URL}/consolidado-manual/lancamentos?${queryString}`
    : `${BASE_URL}/consolidado-manual/lancamentos`;

  const response = await fetch(url);

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      data?.error ?? "Erro ao carregar lancamentos do consolidado manual",
    );
  }

  return response.json();
}

export async function getManualConsolidadoEntry(
  id: string,
): Promise<ManualConsolidadoEntryResponse> {
  const response = await fetch(`${BASE_URL}/consolidado-manual/lancamentos/${id}`);

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      data?.error ?? "Erro ao carregar lancamento do consolidado manual",
    );
  }

  return response.json();
}

export async function createManualConsolidadoEntry(
  payload: CreateManualConsolidadoEntryPayload,
): Promise<ManualConsolidadoEntryResponse> {
  const response = await fetch(`${BASE_URL}/consolidado-manual/lancamentos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Erro ao criar lancamento manual");
  }

  return response.json();
}

export async function updateManualConsolidadoEntry(
  id: string,
  payload: UpdateManualConsolidadoEntryPayload,
): Promise<ManualConsolidadoEntryResponse> {
  const response = await fetch(`${BASE_URL}/consolidado-manual/lancamentos/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Erro ao atualizar lancamento manual");
  }

  return response.json();
}

export async function deleteManualConsolidadoEntry(
  id: string,
): Promise<DeleteManualConsolidadoEntryResponse> {
  const response = await fetch(`${BASE_URL}/consolidado-manual/lancamentos/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Erro ao excluir lancamento manual");
  }

  return response.json();
}
