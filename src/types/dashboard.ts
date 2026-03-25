export type DashboardSummary = {
  available: number;
  sucata: number;
  application: number;
  total: number;
  availablePercent: number;
  sucataPercent: number;
  applicationPercent: number;
  companiesCount: number;
  groupsCount: number;
};

export type DashboardGroup = {
  name: string;
  available: number;
  sucata: number;
  application: number;
  total: number;
};

export type DashboardCompany = {
  name: string;
  groupName: string;
  available: number;
  sucata: number;
  application: number;
  total: number;
};

export type DashboardAccount = {
  accountId: string;
  bankName: string;
  companyName: string;
  groupName: string;
  referenceDate: string | null;
  initialAvailable: number;
  initialApplication: number;
  entries: number;
  outputs: number;
  fees: number;
  yields: number;
  rescues: number;
  applications: number;
  transferEcIn: number;
  transferEcOut: number;
  transferEcNet: number;
  available: number;
  application: number;
  sucata: number;
  total: number;
};

export type DashboardFilters = {
  dateFrom: string | null;
  dateTo: string | null;
  companyName: string | null;
  groupName: string | null;
};

export type DashboardConsolidadoData = {
  filters: DashboardFilters;
  summary: DashboardSummary;
  groups: DashboardGroup[];
  companies: DashboardCompany[];
  accounts: DashboardAccount[];
};

export type DashboardConsolidadoResponse = {
  message: string;
  data: DashboardConsolidadoData;
};
