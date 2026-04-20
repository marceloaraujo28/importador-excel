export type ManualConsolidadoAssignment =
  | "ENTRADAS"
  | "SAIDAS"
  | "RESGATES"
  | "APLICACOES"
  | "TRANSFERENCIA_EC";

export type ManualConsolidadoStatus = "AUTORIZADO" | "NAO_AUTORIZADO";

export type ManualConsolidadoStatusFilter =
  | ManualConsolidadoStatus
  | "TODOS";

export type ManualConsolidadoTransferDirection = "ENTRADA" | "SAIDA";

export type ManualConsolidadoDashboardFilters = {
  accountIds: string[];
  dateFrom: string | null;
  dateTo: string | null;
  status: ManualConsolidadoStatusFilter;
};

export type ManualConsolidadoDashboardRow = {
  accountId: string;
  companyName: string;
  referenceDate: string | null;
  initialBalance: number;
  entries: number;
  outputs: number;
  rescues: number;
  applications: number;
  transferBetweenAccounts: number;
  total: number;
};

export type ManualConsolidadoDashboardTotals = {
  initialBalance: number;
  entries: number;
  outputs: number;
  rescues: number;
  applications: number;
  transferBetweenAccounts: number;
  total: number;
};

export type ManualConsolidadoDashboardData = {
  filters: ManualConsolidadoDashboardFilters;
  rows: ManualConsolidadoDashboardRow[];
  totals: ManualConsolidadoDashboardTotals;
};

export type ManualConsolidadoDashboardResponse = {
  message: string;
  data: ManualConsolidadoDashboardData;
};

export type ManualConsolidadoEntry = {
  id: string;
  accountId: string;
  companyName: string;
  date: string;
  dateKey: string;
  amount: number;
  description: string;
  assignment: ManualConsolidadoAssignment;
  transferDirection: ManualConsolidadoTransferDirection | null;
  status: ManualConsolidadoStatus;
  createdAt: string;
  updatedAt: string;
};

export type ManualConsolidadoEntriesMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type ManualConsolidadoEntriesResponse = {
  message: string;
  data: ManualConsolidadoEntry[];
  meta: ManualConsolidadoEntriesMeta;
};

export type ManualConsolidadoEntryResponse = {
  message: string;
  data: ManualConsolidadoEntry;
};

export type ManualConsolidadoEntryFilters = {
  page?: number;
  pageSize?: number;
  accountIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  dateOrder?: "asc" | "desc";
  amount?: number;
  description?: string;
  assignment?: ManualConsolidadoAssignment;
  status?: ManualConsolidadoStatusFilter;
};

export type CreateManualConsolidadoEntryPayload = {
  accountId: string;
  date: string;
  amount: number;
  description: string;
  assignment: ManualConsolidadoAssignment;
  transferDirection?: ManualConsolidadoTransferDirection | null;
};

export type UpdateManualConsolidadoEntryPayload = {
  accountId?: string;
  date?: string;
  amount?: number;
  description?: string;
  assignment?: ManualConsolidadoAssignment;
  transferDirection?: ManualConsolidadoTransferDirection | null;
  status?: ManualConsolidadoStatus;
};

export type DeleteManualConsolidadoEntryResponse = {
  message: string;
  deletedCount: number;
};
