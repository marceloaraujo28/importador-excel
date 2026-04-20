import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarRange, Loader2 } from "lucide-react";
import { compareByAccountDisplayOrder } from "../../constants/account-display-order";

import type {
  DashboardAccount,
  DashboardCompany,
  DashboardConsolidadoData,
  DashboardGroup,
} from "../../types/dashboard";
import { getDashboardConsolidado } from "../../services/dashboard.service";

type DashboardTab = "sintetica" | "analitica" | "detalhada";
type ConsolidadoMetricTab = "available" | "sucata" | "application";

const GROUP_ORDER = ["Grupo Vale do Verdão", "Grupo Cambuí"] as const;

const COMPANY_ORDER = [
  "Vale do Verdão S/A Açúcar e Álcool",
  "Usina Panorama S/A",
  "Floresta S/A Açúcar e Álcool",
  "Agropecuária Primavera LTDA",
  "Floresta Agrícola LTDA",
  "Energética Entre Rios",
  "Cambuí Açúcar e Álcool LTDA",
  "Energética Cambuí LTDA",
] as const;

const COMPANY_ORDER_INDEX = new Map<string, number>(
  COMPANY_ORDER.map((name, index) => [name, index]),
);

const GROUP_ORDER_INDEX = new Map<string, number>(
  GROUP_ORDER.map((name, index) => [name, index]),
);

function getTodayInputValue() {
  const currentDate = new Date();
  const timezoneOffset = currentDate.getTimezoneOffset();
  const localDate = new Date(
    currentDate.getTime() - timezoneOffset * 60 * 1000,
  );

  return localDate.toISOString().slice(0, 10);
}

function isDateAfter(dateA: string, dateB: string) {
  return Boolean(dateA && dateB && dateA > dateB);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatCurrencyOrDash(value: number) {
  if (!value) return "-";
  return formatCurrency(value);
}

function getSignedValueColor(value: number) {
  if (value > 0) return "text-emerald-600";
  if (value < 0) return "text-red-600";
  return "text-gray-500";
}

function getPositiveValueColor(value: number) {
  if (!value) return "text-gray-500";
  return "text-emerald-600";
}

function getNegativeValueColor(value: number) {
  if (!value) return "text-gray-500";
  return "text-red-600";
}

const VALUE_CELL_CLASS = "px-3 py-3 whitespace-nowrap text-right tabular-nums";

function getMetricColor(metric: ConsolidadoMetricTab | "total") {
  switch (metric) {
    case "available":
      return "text-emerald-600";
    case "sucata":
      return "text-amber-600";
    case "application":
      return "text-blue-600";
    default:
      return "text-gray-900";
  }
}

function getGroupByName(groups: DashboardGroup[], name: string) {
  return groups.find((group) => group.name === name) ?? null;
}

function getMetricValue(
  company: DashboardCompany,
  metric: ConsolidadoMetricTab,
): number {
  if (metric === "available") return company.available;
  if (metric === "sucata") return company.sucata;
  return company.application;
}

function compareCompaniesByDefinedOrder(
  a: { name: string },
  b: { name: string },
) {
  const aIndex = COMPANY_ORDER_INDEX.get(a.name) ?? Number.MAX_SAFE_INTEGER;
  const bIndex = COMPANY_ORDER_INDEX.get(b.name) ?? Number.MAX_SAFE_INTEGER;

  if (aIndex !== bIndex) {
    return aIndex - bIndex;
  }

  return a.name.localeCompare(b.name);
}

function compareGroupsByDefinedOrder(
  a: { name: string } | { groupName: string },
  b: { name: string } | { groupName: string },
) {
  const aName = "name" in a ? a.name : a.groupName;
  const bName = "name" in b ? b.name : b.groupName;

  const aIndex =
    GROUP_ORDER_INDEX.get(aName as (typeof GROUP_ORDER)[number]) ??
    Number.MAX_SAFE_INTEGER;
  const bIndex =
    GROUP_ORDER_INDEX.get(bName as (typeof GROUP_ORDER)[number]) ??
    Number.MAX_SAFE_INTEGER;

  if (aIndex !== bIndex) {
    return aIndex - bIndex;
  }

  return aName.localeCompare(bName);
}

function sumAccounts(accounts: DashboardAccount[]) {
  return accounts.reduce(
    (acc, account) => {
      acc.initialAvailable += account.initialAvailable;
      acc.initialApplication += account.initialApplication;
      acc.entries += account.entries;
      acc.outputs += account.outputs;
      acc.fees += account.fees;
      acc.yields += account.yields;
      acc.rescues += account.rescues;
      acc.applications += account.applications;
      acc.transferEcIn += account.transferEcIn;
      acc.transferEcOut += account.transferEcOut;
      acc.transferEcNet += account.transferEcNet;
      acc.available += account.available;
      acc.application += account.application;
      acc.sucata += account.sucata;
      acc.total += account.total;

      return acc;
    },
    {
      initialAvailable: 0,
      initialApplication: 0,
      entries: 0,
      outputs: 0,
      fees: 0,
      yields: 0,
      rescues: 0,
      applications: 0,
      transferEcIn: 0,
      transferEcOut: 0,
      transferEcNet: 0,
      available: 0,
      application: 0,
      sucata: 0,
      total: 0,
    },
  );
}

function buildGroupedCompanies(companies: DashboardCompany[]) {
  const map = new Map<string, DashboardCompany[]>();

  for (const company of companies) {
    const current = map.get(company.groupName) ?? [];
    current.push(company);
    map.set(company.groupName, current);
  }

  return Array.from(map.entries())
    .map(([groupName, items]) => ({
      groupName,
      companies: [...items].sort(compareCompaniesByDefinedOrder),
      totals: items.reduce(
        (acc, company) => {
          acc.available += company.available;
          acc.sucata += company.sucata;
          acc.application += company.application;
          acc.total += company.total;
          return acc;
        },
        {
          available: 0,
          sucata: 0,
          application: 0,
          total: 0,
        },
      ),
    }))
    .sort(compareGroupsByDefinedOrder);
}

function GroupSummaryCard({
  title,
  companiesCount,
  available,
  sucata,
  application,
  total,
}: {
  title: string;
  companiesCount: number;
  available: number;
  sucata: number;
  application: number;
  total: number;
}) {
  const totalForPercent = total || 1;
  const availablePercent = (available / totalForPercent) * 100;
  const sucataPercent = (sucata / totalForPercent) * 100;
  const applicationPercent = (application / totalForPercent) * 100;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <span className="text-sm text-gray-500">Empresas</span>
          <span className="font-semibold text-gray-900">{companiesCount}</span>
        </div>

        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <span className="text-sm text-gray-500">Disponível</span>
          <span className="font-semibold text-emerald-600">
            {formatCurrency(available)}
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <span className="text-sm text-gray-500">Sucata</span>
          <span className="font-semibold text-amber-600">
            {formatCurrencyOrDash(sucata)}
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <span className="text-sm text-gray-500">Aplicação</span>
          <span className="font-semibold text-blue-600">
            {formatCurrencyOrDash(application)}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-base font-semibold text-gray-900">Total</span>
          <span className="text-2xl font-bold text-gray-900">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-full bg-gray-100">
        <div className="flex h-3 w-full">
          <div
            className="bg-emerald-500"
            style={{ width: `${availablePercent}%` }}
          />
          <div
            className="bg-amber-500"
            style={{ width: `${sucataPercent}%` }}
          />
          <div
            className="bg-blue-500"
            style={{ width: `${applicationPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function DashboardMetricCard({
  label,
  value,
  colorClass,
  subtitle,
}: {
  label: string;
  value: number;
  colorClass: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className={`mt-3 text-2xl font-bold ${colorClass}`}>
        {formatCurrency(value)}
      </p>
      {subtitle && <p className="mt-2 text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const todayInputValue = getTodayInputValue();
  const [activeTab, setActiveTab] = useState<DashboardTab>("sintetica");
  const [metricTab, setMetricTab] = useState<ConsolidadoMetricTab>("available");

  const [dateFromInput, setDateFromInput] = useState(todayInputValue);
  const [dateToInput, setDateToInput] = useState(todayInputValue);

  const [appliedDateFrom, setAppliedDateFrom] = useState(todayInputValue);
  const [appliedDateTo, setAppliedDateTo] = useState(todayInputValue);

  const [selectedCompanyName, setSelectedCompanyName] = useState("");

  const [dashboardData, setDashboardData] =
    useState<DashboardConsolidadoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadDashboard(params?: {
    dateFrom?: string;
    dateTo?: string;
  }) {
    try {
      if (dashboardData) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setErrorMessage(null);

      const result = await getDashboardConsolidado({
        dateFrom: params?.dateFrom || undefined,
        dateTo: params?.dateTo || undefined,
      });

      setDashboardData(result.data);

      const sortedCompanies = [...result.data.companies].sort(
        compareCompaniesByDefinedOrder,
      );
      const firstCompany = sortedCompanies[0]?.name ?? "";
      setSelectedCompanyName((current) => current || firstCompany);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao carregar dashboard.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadDashboard({
      dateFrom: todayInputValue,
      dateTo: todayInputValue,
    });
  }, []);

  const groups = useMemo(
    () => [...(dashboardData?.groups ?? [])].sort(compareGroupsByDefinedOrder),
    [dashboardData?.groups],
  );

  const companies = useMemo(
    () =>
      [...(dashboardData?.companies ?? [])].sort(
        compareCompaniesByDefinedOrder,
      ),
    [dashboardData?.companies],
  );

  const accounts = dashboardData?.accounts ?? [];
  const summary = dashboardData?.summary ?? null;

  const valeGroup = useMemo(
    () => getGroupByName(groups, "Grupo Vale do Verdão"),
    [groups],
  );

  const cambuiGroup = useMemo(
    () => getGroupByName(groups, "Grupo Cambuí"),
    [groups],
  );

  const companiesSortedByMetric = useMemo(() => {
    return [...companies].sort(compareCompaniesByDefinedOrder);
  }, [companies]);

  const groupedCompanies = useMemo(() => {
    return buildGroupedCompanies(companies);
  }, [companies]);

  const detailedCompanyOptions = useMemo(() => {
    const companiesName = [...companies].map((company) => company.name);
    const finalOptions = ["Todas as empresas", ...companiesName];

    return finalOptions;
  }, [companies]);

  const detailedAccounts = useMemo(() => {
    if (selectedCompanyName === "Todas as empresas") {
      return [...accounts].sort(compareByAccountDisplayOrder);
    }

    return accounts.filter(
      (account) => account.companyName === selectedCompanyName,
    );
  }, [accounts, selectedCompanyName]);

  const detailedTotals = useMemo(() => {
    return sumAccounts(detailedAccounts);
  }, [detailedAccounts]);

  async function handleApplyFilters() {
    setAppliedDateFrom(dateFromInput);
    setAppliedDateTo(dateToInput);

    await loadDashboard({
      dateFrom: dateFromInput || undefined,
      dateTo: dateToInput || undefined,
    });
  }

  function handleDateFromChange(value: string) {
    setDateFromInput(value);

    if (dateToInput && isDateAfter(value, dateToInput)) {
      setDateToInput(value);
    }
  }

  function handleDateToChange(value: string) {
    setDateToInput(value);

    if (dateFromInput && isDateAfter(dateFromInput, value)) {
      setDateFromInput(value);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="mr-2 animate-spin" size={18} />
          Carregando dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Demonstração de Saldo dos Bancos
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Consolidação financeira por grupo, empresa e conta.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-3 sm:flex-row">
            <div className="min-w-40">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Data inicial
              </label>
              <input
                type="date"
                value={dateFromInput}
                max={dateToInput || undefined}
                onChange={(event) => handleDateFromChange(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="min-w-40">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Data final
              </label>
              <input
                type="date"
                value={dateToInput}
                min={dateFromInput || undefined}
                onChange={(event) => handleDateToChange(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="button"
              onClick={handleApplyFilters}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <CalendarRange size={16} />
              {isRefreshing ? "Atualizando..." : "Aplicar"}
            </button>
          </div>

          <div className="flex overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("sintetica")}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === "sintetica"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-white"
              }`}
            >
              Visão Sintética
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("analitica")}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === "analitica"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-white"
              }`}
            >
              Visão Analítica
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("detalhada")}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === "detalhada"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-white"
              }`}
            >
              Visão Detalhada
            </button>
          </div>
        </div>
      </div>

      {(appliedDateFrom || appliedDateTo) && (
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Filtro aplicado:
          {appliedDateFrom ? ` de ${appliedDateFrom}` : " início livre"}
          {appliedDateTo ? ` até ${appliedDateTo}` : " até hoje"}
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            {errorMessage}
          </div>
        </div>
      )}

      {activeTab === "sintetica" && summary && (
        <div className="mt-6 space-y-5">
          <div className="grid gap-5 xl:grid-cols-2">
            <GroupSummaryCard
              title="TOTAL - GRUPO VALE DO VERDÃO"
              companiesCount={
                companies.filter(
                  (company) => company.groupName === "Grupo Vale do Verdão",
                ).length
              }
              available={valeGroup?.available ?? 0}
              sucata={valeGroup?.sucata ?? 0}
              application={valeGroup?.application ?? 0}
              total={valeGroup?.total ?? 0}
            />

            <GroupSummaryCard
              title="TOTAL - CAMBUÍ"
              companiesCount={
                companies.filter(
                  (company) => company.groupName === "Grupo Cambuí",
                ).length
              }
              available={cambuiGroup?.available ?? 0}
              sucata={cambuiGroup?.sucata ?? 0}
              application={cambuiGroup?.application ?? 0}
              total={cambuiGroup?.total ?? 0}
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-linear-to-r from-white to-gray-50 p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  CONSOLIDADO GERAL
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {summary.companiesCount} empresas no total
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <DashboardMetricCard
                  label="Disponível"
                  value={summary.available}
                  colorClass="text-emerald-600"
                />
                <DashboardMetricCard
                  label="Sucata"
                  value={summary.sucata}
                  colorClass="text-amber-600"
                />
                <DashboardMetricCard
                  label="Aplicação"
                  value={summary.application}
                  colorClass="text-blue-600"
                />
                <DashboardMetricCard
                  label="Total"
                  value={summary.total}
                  colorClass="text-gray-900"
                />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">
                    Composição do Consolidado
                  </h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Veja a distribuição por empresa em cada categoria.
                  </p>
                </div>

                <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-1">
                  <button
                    type="button"
                    onClick={() => setMetricTab("available")}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      metricTab === "available"
                        ? "bg-white text-emerald-600 shadow-sm"
                        : "text-gray-600 hover:bg-white"
                    }`}
                  >
                    Disponível
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetricTab("sucata")}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      metricTab === "sucata"
                        ? "bg-white text-amber-600 shadow-sm"
                        : "text-gray-600 hover:bg-white"
                    }`}
                  >
                    Sucata
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetricTab("application")}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      metricTab === "application"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:bg-white"
                    }`}
                  >
                    Aplicação
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {companiesSortedByMetric.map((company) => (
                  <div
                    key={`${company.groupName}-${company.name}`}
                    className="flex items-center justify-between border-b border-gray-100 pb-3 text-sm"
                  >
                    <span className="text-gray-700">{company.name}</span>
                    <span
                      className={`font-semibold ${getMetricColor(metricTab)}`}
                    >
                      {formatCurrencyOrDash(getMetricValue(company, metricTab))}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 overflow-hidden rounded-full bg-gray-100">
                <div className="flex h-4 w-full">
                  <div
                    className="bg-emerald-500"
                    style={{ width: `${summary.availablePercent}%` }}
                  />
                  <div
                    className="bg-amber-500"
                    style={{ width: `${summary.sucataPercent}%` }}
                  />
                  <div
                    className="bg-blue-500"
                    style={{ width: `${summary.applicationPercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Disponível: {formatPercent(summary.availablePercent)}
                </span>
                <span>Sucata: {formatPercent(summary.sucataPercent)}</span>
                <span>
                  Aplicação: {formatPercent(summary.applicationPercent)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "analitica" && summary && (
        <div className="mt-6 space-y-5">
          <div className="grid gap-4 lg:grid-cols-4">
            <DashboardMetricCard
              label="Disponível"
              value={summary.available}
              colorClass="text-emerald-600"
              subtitle={`${formatPercent(summary.availablePercent)} do total`}
            />
            <DashboardMetricCard
              label="Sucata"
              value={summary.sucata}
              colorClass="text-amber-600"
              subtitle={`${formatPercent(summary.sucataPercent)} do total`}
            />
            <DashboardMetricCard
              label="Aplicação"
              value={summary.application}
              colorClass="text-blue-600"
              subtitle={`${formatPercent(summary.applicationPercent)} do total`}
            />
            <DashboardMetricCard
              label="Total Geral"
              value={summary.total}
              colorClass="text-gray-900"
              subtitle={`${summary.groupsCount} grupos • ${summary.companiesCount} empresas`}
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50">
                <tr className="text-sm uppercase tracking-wide text-gray-700">
                  <th className="px-4 py-4 font-semibold">Empresas</th>
                  <th className="px-4 py-4 font-semibold">Disponível</th>
                  <th className="px-4 py-4 font-semibold">Sucata</th>
                  <th className="px-4 py-4 font-semibold">Aplicação</th>
                  <th className="px-4 py-4 font-semibold">Total</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {groupedCompanies.map((group) => (
                  <FragmentGroupRows
                    key={group.groupName}
                    groupName={group.groupName}
                    companies={group.companies}
                    totals={group.totals}
                  />
                ))}

                <tr className="bg-gray-100 font-bold text-gray-900">
                  <td className="px-4 py-4">TOTAL GERAL</td>
                  <td className="px-4 py-4 text-emerald-600">
                    {formatCurrency(summary.available)}
                  </td>
                  <td className="px-4 py-4 text-amber-600">
                    {formatCurrencyOrDash(summary.sucata)}
                  </td>
                  <td className="px-4 py-4 text-blue-600">
                    {formatCurrencyOrDash(summary.application)}
                  </td>
                  <td className="px-4 py-4 text-gray-900">
                    {formatCurrency(summary.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "detalhada" && (
        <div className="mt-6 space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Visão detalhada por empresa
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Mostra como os valores foram compostos por conta.
              </p>
            </div>

            <div className="w-full max-w-md">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Selecionar empresa
              </label>
              <select
                value={selectedCompanyName}
                onChange={(event) => setSelectedCompanyName(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {detailedCompanyOptions.map((companyName) => (
                  <option key={companyName} value={companyName}>
                    {companyName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full min-w-340 text-left">
              <thead className="bg-gray-50">
                <tr className="text-[11px] uppercase tracking-wide text-gray-700">
                  <th className="px-3 py-3 font-semibold">ID</th>
                  <th className="px-3 py-3 font-semibold">Banco</th>
                  <th className="px-3 py-3 font-semibold">Tipo</th>
                  <th className="px-3 py-3 font-semibold">Saldo Inicial</th>
                  <th className="px-3 py-3 font-semibold">Entradas</th>
                  <th className="px-3 py-3 font-semibold">Saídas</th>
                  <th className="px-3 py-3 font-semibold">Tarifas</th>
                  <th className="px-3 py-3 font-semibold">Rendimentos</th>
                  <th className="px-3 py-3 font-semibold">Resgates</th>
                  <th className="px-3 py-3 font-semibold">Aplicações</th>
                  <th className="px-3 py-3 font-semibold">Transferência EC</th>
                  <th className="px-3 py-3 font-semibold">Saldo Final</th>
                  <th className="px-3 py-3 font-semibold">Consolidado</th>
                </tr>
              </thead>

              <tbody>
                {detailedAccounts.map((account) => {
                  const correnteSaldoInicial = account.initialAvailable;
                  const correnteSaldoFinal = account.available;

                  const aplicacaoSaldoInicial = account.initialApplication;
                  const aplicacaoSaldoFinal =
                    account.application + account.sucata;

                  return (
                    <>
                      <tr
                        key={`${account.accountId}-corrente`}
                        className="border-t border-gray-400 text-sm text-gray-700"
                      >
                        <td
                          rowSpan={2}
                          className="px-3 py-3 align-middle font-medium text-gray-900"
                        >
                          {account.accountId}
                        </td>

                        <td
                          rowSpan={2}
                          className="px-3 py-3 align-middle text-gray-700"
                        >
                          {account.bankName}
                        </td>

                        <td className="px-3 py-3 font-medium text-gray-900">
                          CONTA CORRENTE
                        </td>

                        <td className={VALUE_CELL_CLASS}>
                          {formatCurrencyOrDash(correnteSaldoInicial)}
                        </td>

                        <td
                          className={`${VALUE_CELL_CLASS} ${getPositiveValueColor(
                            account.entries,
                          )}`}
                        >
                          {formatCurrencyOrDash(account.entries)}
                        </td>

                        <td
                          className={`${VALUE_CELL_CLASS} ${getNegativeValueColor(
                            account.outputs,
                          )}`}
                        >
                          {formatCurrencyOrDash(account.outputs)}
                        </td>

                        <td
                          className={`${VALUE_CELL_CLASS} ${getNegativeValueColor(
                            account.fees,
                          )}`}
                        >
                          {formatCurrencyOrDash(account.fees)}
                        </td>

                        <td
                          className={`${VALUE_CELL_CLASS} ${getPositiveValueColor(
                            account.yields,
                          )}`}
                        >
                          {formatCurrencyOrDash(account.yields)}
                        </td>

                        <td
                          className={`${VALUE_CELL_CLASS} ${getPositiveValueColor(
                            account.rescues,
                          )}`}
                        >
                          {formatCurrencyOrDash(account.rescues)}
                        </td>

                        <td
                          className={`${VALUE_CELL_CLASS} ${getNegativeValueColor(
                            account.applications,
                          )}`}
                        >
                          {formatCurrencyOrDash(account.applications)}
                        </td>

                        <td
                          className={`${VALUE_CELL_CLASS} font-medium ${getSignedValueColor(
                            account.transferEcNet,
                          )}`}
                        >
                          {formatCurrencyOrDash(
                            Math.abs(account.transferEcNet || 0),
                          )}
                        </td>

                        <td
                          className={`${VALUE_CELL_CLASS} font-medium text-gray-900`}
                        >
                          {formatCurrencyOrDash(correnteSaldoFinal)}
                        </td>

                        <td
                          rowSpan={2}
                          className="px-3 py-3 align-middle whitespace-nowrap text-right font-semibold tabular-nums text-gray-900"
                        >
                          {formatCurrency(account.total)}
                        </td>
                      </tr>

                      <tr
                        key={`${account.accountId}-aplicacao`}
                        className="border-t border-gray-100 bg-gray-50/50 text-sm text-gray-700"
                      >
                        <td className="px-3 py-3 font-medium text-gray-900">
                          APLICAÇÕES
                        </td>

                        <td className={VALUE_CELL_CLASS}>
                          {formatCurrencyOrDash(aplicacaoSaldoInicial)}
                        </td>

                        <td className={`${VALUE_CELL_CLASS} text-gray-500`}>
                          -
                        </td>
                        <td className={`${VALUE_CELL_CLASS} text-gray-500`}>
                          -
                        </td>
                        <td className={`${VALUE_CELL_CLASS} text-gray-500`}>
                          -
                        </td>
                        <td
                          className={`${VALUE_CELL_CLASS} ${getPositiveValueColor(
                            account.monthlyYields, // aquiiiii
                          )}`}
                        >
                          {formatCurrencyOrDash(account.monthlyYields)}
                        </td>

                        <td
                          className={`${VALUE_CELL_CLASS} ${getNegativeValueColor(
                            account.rescues,
                          )}`}
                        >
                          {formatCurrencyOrDash(account.rescues)}
                        </td>

                        <td
                          className={`${VALUE_CELL_CLASS} ${getPositiveValueColor(
                            account.applications,
                          )}`}
                        >
                          {formatCurrencyOrDash(account.applications)}
                        </td>

                        <td className={`${VALUE_CELL_CLASS} text-gray-500`}>
                          -
                        </td>

                        <td
                          className={`${VALUE_CELL_CLASS} font-medium ${
                            aplicacaoSaldoFinal < 0
                              ? "text-red-600"
                              : aplicacaoSaldoFinal > 0
                                ? "text-emerald-600"
                                : "text-gray-900"
                          }`}
                        >
                          {formatCurrencyOrDash(aplicacaoSaldoFinal)}
                        </td>
                      </tr>
                    </>
                  );
                })}

                {detailedAccounts.length === 0 && (
                  <tr>
                    <td
                      colSpan={13}
                      className="px-4 py-10 text-center text-sm text-gray-500"
                    >
                      Nenhuma conta encontrada para a empresa selecionada.
                    </td>
                  </tr>
                )}

                {detailedAccounts.length > 0 && (
                  <>
                    <tr className="bg-gray-50 font-semibold text-gray-900">
                      <td colSpan={11} className="px-3 py-3 text-right">
                        CONTA CORRENTE
                      </td>
                      <td className={VALUE_CELL_CLASS}>
                        {formatCurrency(detailedTotals.available)}
                      </td>
                      <td className={VALUE_CELL_CLASS}>
                        {formatCurrency(detailedTotals.available)}
                      </td>
                    </tr>

                    <tr className="bg-gray-50 font-semibold text-gray-900">
                      <td colSpan={11} className="px-3 py-3 text-right">
                        APLICAÇÕES FINANCEIRAS
                      </td>
                      <td
                        className={`${VALUE_CELL_CLASS} ${
                          detailedTotals.application + detailedTotals.sucata < 0
                            ? "text-red-600"
                            : detailedTotals.application +
                                  detailedTotals.sucata >
                                0
                              ? "text-emerald-600"
                              : ""
                        }`}
                      >
                        {formatCurrency(
                          detailedTotals.application + detailedTotals.sucata,
                        )}
                      </td>
                      <td
                        className={`${VALUE_CELL_CLASS} ${
                          detailedTotals.application + detailedTotals.sucata < 0
                            ? "text-red-600"
                            : detailedTotals.application +
                                  detailedTotals.sucata >
                                0
                              ? "text-emerald-600"
                              : ""
                        }`}
                      >
                        {formatCurrency(
                          detailedTotals.application + detailedTotals.sucata,
                        )}
                      </td>
                    </tr>

                    <tr className="bg-gray-100 font-bold text-gray-900">
                      <td colSpan={11} className="px-3 py-3 text-right">
                        TOTAL GERAL
                      </td>
                      <td className={VALUE_CELL_CLASS}>
                        {formatCurrency(detailedTotals.total)}
                      </td>
                      <td className={VALUE_CELL_CLASS}>
                        {formatCurrency(detailedTotals.total)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function FragmentGroupRows({
  groupName,
  companies,
  totals,
}: {
  groupName: string;
  companies: DashboardCompany[];
  totals: {
    available: number;
    sucata: number;
    application: number;
    total: number;
  };
}) {
  return (
    <>
      {companies.map((company) => (
        <tr key={`${groupName}-${company.name}`} className="text-gray-700">
          <td className="px-4 py-4 font-medium text-gray-900">
            {company.name}
          </td>
          <td className="px-4 py-4 text-emerald-600">
            {formatCurrency(company.available)}
          </td>
          <td className="px-4 py-4 text-amber-600">
            {formatCurrencyOrDash(company.sucata)}
          </td>
          <td className="px-4 py-4 text-blue-600">
            {formatCurrencyOrDash(company.application)}
          </td>
          <td className="px-4 py-4 text-gray-900">
            {formatCurrency(company.total)}
          </td>
        </tr>
      ))}

      <tr className="bg-gray-50 font-semibold text-gray-900">
        <td className="px-4 py-4">
          {groupName === "Grupo Vale do Verdão"
            ? "TOTAL - GRUPO VALE DO VERDÃO"
            : "TOTAL - CAMBUÍ"}
        </td>
        <td className="px-4 py-4 text-emerald-600">
          {formatCurrency(totals.available)}
        </td>
        <td className="px-4 py-4 text-amber-600">
          {formatCurrencyOrDash(totals.sucata)}
        </td>
        <td className="px-4 py-4 text-blue-600">
          {formatCurrencyOrDash(totals.application)}
        </td>
        <td className="px-4 py-4 text-gray-900">
          {formatCurrency(totals.total)}
        </td>
      </tr>
    </>
  );
}
