import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarRange,
  Loader2,
  Pencil,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { NumericFormat } from "react-number-format";
import { useLocation, useNavigate } from "react-router-dom";
import { ACCOUNT_FILTER_ITEMS } from "../../constants/account-filters";
import { compareByAccountDisplayOrder } from "../../constants/account-display-order";
import {
  getManualConsolidadoAssignmentClasses,
  getManualConsolidadoAssignmentLabel,
  getManualConsolidadoStatusClasses,
  MANUAL_CONSOLIDADO_ASSIGNMENT_OPTIONS,
  MANUAL_CONSOLIDADO_STATUS_FILTER_OPTIONS,
  MANUAL_CONSOLIDADO_STATUS_OPTIONS,
} from "../../constants/manual-consolidado";
import CheckboxMultiSelect from "../../components/filters/CheckboxMultiSelect";
import {
  deleteManualConsolidadoEntry,
  getManualConsolidadoDashboard,
  listManualConsolidadoEntries,
  updateManualConsolidadoEntry,
} from "../../services/manual-consolidado.service";
import type {
  ManualConsolidadoAssignment,
  ManualConsolidadoDashboardData,
  ManualConsolidadoEntriesMeta,
  ManualConsolidadoEntry,
  ManualConsolidadoStatus,
  ManualConsolidadoStatusFilter,
} from "../../types/manual-consolidado";

type ManualConsolidadoTab = "resumo" | "registros";

type ActiveSummaryFiltersState = {
  accountIds: string[];
  dateFrom?: string;
  dateTo?: string;
  status: ManualConsolidadoStatusFilter;
};

type ActiveEntryFiltersState = {
  page: number;
  pageSize: number;
  accountIds: string[];
  dateFrom?: string;
  dateTo?: string;
  amount?: number;
  description?: string;
  assignment?: ManualConsolidadoAssignment[];
  status: ManualConsolidadoStatusFilter;
  dateOrder: "asc" | "desc";
};

const DEFAULT_ENTRIES_META: ManualConsolidadoEntriesMeta = {
  page: 1,
  pageSize: 50,
  totalItems: 0,
  totalPages: 1,
  filteredAmount: 0,
};

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

function isTransferDirectionCredit(
  direction: ManualConsolidadoEntry["transferDirection"],
) {
  return direction === "ENTRADA";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatCurrencyOrDash(value: number) {
  if (!value) return "-";
  return formatCurrency(value);
}

function formatNegativeCurrencyOrDash(value: number) {
  if (!value) return "-";
  return `-${formatCurrency(Math.abs(value))}`;
}

function getPositiveValueColor(value: number) {
  if (!value) return "text-gray-500";
  return "text-emerald-600";
}

function getNegativeValueColor(value: number) {
  if (!value) return "text-gray-500";
  return "text-red-600";
}

function getSignedValueColor(value: number) {
  if (value > 0) return "text-emerald-600";
  if (value < 0) return "text-red-600";
  return "text-gray-500";
}

const VALUE_CELL_CLASS = "px-3 py-3 whitespace-nowrap text-right tabular-nums";

export default function ManualConsolidadoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const todayInputValue = getTodayInputValue();

  const initialTab = (
    (location.state as { tab?: ManualConsolidadoTab } | null)?.tab ===
    "registros"
      ? "registros"
      : "resumo"
  ) as ManualConsolidadoTab;

  const [activeTab, setActiveTab] = useState<ManualConsolidadoTab>(initialTab);

  const [summaryAccountIdsInput, setSummaryAccountIdsInput] = useState<
    string[]
  >([]);
  const [summaryDateFromInput, setSummaryDateFromInput] =
    useState(todayInputValue);
  const [summaryDateToInput, setSummaryDateToInput] = useState(todayInputValue);
  const [summaryStatusInput, setSummaryStatusInput] =
    useState<ManualConsolidadoStatusFilter>("TODOS");
  const [activeSummaryFilters, setActiveSummaryFilters] =
    useState<ActiveSummaryFiltersState>({
      accountIds: [] as string[],
      dateFrom: todayInputValue,
      dateTo: todayInputValue,
      status: "TODOS" as ManualConsolidadoStatusFilter,
    });
  const [summaryDashboard, setSummaryDashboard] =
    useState<ManualConsolidadoDashboardData | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [isSummaryRefreshing, setIsSummaryRefreshing] = useState(false);
  const [summaryErrorMessage, setSummaryErrorMessage] = useState<string | null>(
    null,
  );

  const [entriesAccountIdsInput, setEntriesAccountIdsInput] = useState<
    string[]
  >([]);
  const [entriesDateFromInput, setEntriesDateFromInput] = useState("");
  const [entriesDateToInput, setEntriesDateToInput] = useState("");
  const [entriesAmountInput, setEntriesAmountInput] = useState<
    number | undefined
  >(undefined);
  const [entriesDescriptionInput, setEntriesDescriptionInput] = useState("");
  const [entriesAssignmentInput, setEntriesAssignmentInput] = useState<
    ManualConsolidadoAssignment[]
  >([]);
  const [entriesStatusInput, setEntriesStatusInput] =
    useState<ManualConsolidadoStatusFilter>("TODOS");
  const [entriesDateOrderInput, setEntriesDateOrderInput] = useState<
    "asc" | "desc"
  >("desc");
  const [activeEntryFilters, setActiveEntryFilters] =
    useState<ActiveEntryFiltersState>({
      page: 1,
      pageSize: DEFAULT_ENTRIES_META.pageSize,
      accountIds: [] as string[],
      dateFrom: undefined as string | undefined,
      dateTo: undefined as string | undefined,
      amount: undefined as number | undefined,
      description: undefined as string | undefined,
      assignment: undefined as ManualConsolidadoAssignment[] | undefined,
      status: "TODOS" as ManualConsolidadoStatusFilter,
      dateOrder: "desc" as "asc" | "desc",
    });
  const [entries, setEntries] = useState<ManualConsolidadoEntry[]>([]);
  const [entriesMeta, setEntriesMeta] =
    useState<ManualConsolidadoEntriesMeta>(DEFAULT_ENTRIES_META);
  const [isEntriesLoading, setIsEntriesLoading] = useState(true);
  const [isEntriesRefreshing, setIsEntriesRefreshing] = useState(false);
  const [entriesErrorMessage, setEntriesErrorMessage] = useState<string | null>(
    null,
  );
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const summaryFilters = useMemo(
    () => ({
      accountIds: summaryAccountIdsInput,
      dateFrom: summaryDateFromInput || undefined,
      dateTo: summaryDateToInput || undefined,
      status: summaryStatusInput,
    }),
    [
      summaryAccountIdsInput,
      summaryDateFromInput,
      summaryDateToInput,
      summaryStatusInput,
    ],
  );

  const entryFilters = useMemo(
    () => ({
      page: entriesMeta.page,
      pageSize: entriesMeta.pageSize,
      accountIds: entriesAccountIdsInput,
      dateFrom: entriesDateFromInput || undefined,
      dateTo: entriesDateToInput || undefined,
      amount: entriesAmountInput,
      description: entriesDescriptionInput.trim() || undefined,
      assignment: entriesAssignmentInput.length
        ? entriesAssignmentInput
        : undefined,
      status: entriesStatusInput,
      dateOrder: entriesDateOrderInput,
    }),
    [
      entriesAccountIdsInput,
      entriesAmountInput,
      entriesAssignmentInput,
      entriesDateFromInput,
      entriesDateOrderInput,
      entriesDateToInput,
      entriesDescriptionInput,
      entriesMeta.page,
      entriesMeta.pageSize,
      entriesStatusInput,
    ],
  );

  const hasAppliedEntryFilters = useMemo(
    () =>
      Boolean(
        activeEntryFilters.accountIds.length ||
        activeEntryFilters.dateFrom ||
        activeEntryFilters.dateTo ||
        activeEntryFilters.amount !== undefined ||
        activeEntryFilters.description ||
        activeEntryFilters.assignment?.length ||
        activeEntryFilters.status !== "TODOS",
      ),
    [activeEntryFilters],
  );

  const orderedSummaryRows = useMemo(
    () =>
      [...(summaryDashboard?.rows ?? [])].sort(compareByAccountDisplayOrder),
    [summaryDashboard?.rows],
  );

  useEffect(() => {
    const nextTab = (location.state as { tab?: ManualConsolidadoTab } | null)
      ?.tab;

    if (nextTab === "registros" || nextTab === "resumo") {
      setActiveTab(nextTab);
    }
  }, [location.state]);

  useEffect(() => {
    void loadSummary(activeSummaryFilters, false);
    void loadEntries(activeEntryFilters, false);
  }, []);

  async function loadSummary(
    filters = activeSummaryFilters,
    keepCurrentData = true,
  ) {
    try {
      if (keepCurrentData && summaryDashboard) {
        setIsSummaryRefreshing(true);
      } else {
        setIsSummaryLoading(true);
      }

      setSummaryErrorMessage(null);

      const result = await getManualConsolidadoDashboard(filters);
      setSummaryDashboard(result.data);
    } catch (error) {
      setSummaryErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao carregar resumo do consolidado manual.",
      );
    } finally {
      setIsSummaryLoading(false);
      setIsSummaryRefreshing(false);
    }
  }

  async function loadEntries(
    filters = activeEntryFilters,
    keepCurrentData = true,
  ) {
    try {
      if (keepCurrentData && entries.length) {
        setIsEntriesRefreshing(true);
      } else {
        setIsEntriesLoading(true);
      }

      setEntriesErrorMessage(null);

      const result = await listManualConsolidadoEntries(filters);
      setEntries(result.data);
      setEntriesMeta(result.meta);
    } catch (error) {
      setEntriesErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao carregar lanÃ§amentos do consolidado manual.",
      );
    } finally {
      setIsEntriesLoading(false);
      setIsEntriesRefreshing(false);
    }
  }

  async function handleApplySummaryFilters() {
    setActiveSummaryFilters(summaryFilters);
    await loadSummary(summaryFilters);
  }

  async function handleApplyEntryFilters() {
    const nextFilters = {
      ...entryFilters,
      page: 1,
    };

    setActiveEntryFilters(nextFilters);
    setEntriesMeta((current) => ({
      ...current,
      page: 1,
    }));

    await loadEntries(nextFilters);
  }

  async function handleClearEntryFilters() {
    const clearedFilters = {
      page: activeEntryFilters.page,
      pageSize: activeEntryFilters.pageSize,
      accountIds: [] as string[],
      dateFrom: undefined as string | undefined,
      dateTo: undefined as string | undefined,
      amount: undefined as number | undefined,
      description: undefined as string | undefined,
      assignment: undefined as ManualConsolidadoAssignment[] | undefined,
      status: "TODOS" as ManualConsolidadoStatusFilter,
      dateOrder: "desc" as "asc" | "desc",
    };

    setEntriesAccountIdsInput([]);
    setEntriesDateFromInput("");
    setEntriesDateToInput("");
    setEntriesAmountInput(undefined);
    setEntriesDescriptionInput("");
    setEntriesAssignmentInput([]);
    setEntriesStatusInput("TODOS");
    setEntriesDateOrderInput("desc");
    setActiveEntryFilters(clearedFilters);

    await loadEntries(clearedFilters);
  }

  async function handleChangeEntriesPage(nextPage: number) {
    const boundedPage = Math.max(1, Math.min(entriesMeta.totalPages, nextPage));
    const nextFilters = {
      ...activeEntryFilters,
      page: boundedPage,
    };

    setActiveEntryFilters(nextFilters);
    setEntriesMeta((current) => ({
      ...current,
      page: boundedPage,
    }));

    await loadEntries(nextFilters);
  }

  async function handleStatusChange(
    entry: ManualConsolidadoEntry,
    status: ManualConsolidadoStatus,
  ) {
    try {
      setStatusUpdatingId(entry.id);
      setEntriesErrorMessage(null);

      await updateManualConsolidadoEntry(entry.id, { status });

      await Promise.all([
        loadEntries(activeEntryFilters),
        loadSummary(activeSummaryFilters),
      ]);
    } catch (error) {
      setEntriesErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar status do lanÃ§amento manual.",
      );
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function handleDeleteEntry(id: string) {
    try {
      setEntriesErrorMessage(null);
      await deleteManualConsolidadoEntry(id);
      setDeleteConfirmId(null);

      const nextPage =
        entries.length === 1 && entriesMeta.page > 1
          ? entriesMeta.page - 1
          : entriesMeta.page;

      const nextFilters = {
        ...activeEntryFilters,
        page: nextPage,
      };

      setActiveEntryFilters(nextFilters);
      setEntriesMeta((current) => ({
        ...current,
        page: nextPage,
      }));

      await Promise.all([
        loadEntries(nextFilters),
        loadSummary(activeSummaryFilters),
      ]);
    } catch (error) {
      setEntriesErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao excluir lanÃ§amento manual.",
      );
    }
  }

  function handleSummaryDateFromChange(value: string) {
    setSummaryDateFromInput(value);

    if (summaryDateToInput && isDateAfter(value, summaryDateToInput)) {
      setSummaryDateToInput(value);
    }
  }

  function handleSummaryDateToChange(value: string) {
    setSummaryDateToInput(value);

    if (summaryDateFromInput && isDateAfter(summaryDateFromInput, value)) {
      setSummaryDateFromInput(value);
    }
  }

  function handleEntriesDateFromChange(value: string) {
    setEntriesDateFromInput(value);

    if (entriesDateToInput && isDateAfter(value, entriesDateToInput)) {
      setEntriesDateToInput(value);
    }
  }

  function handleEntriesDateToChange(value: string) {
    setEntriesDateToInput(value);

    if (entriesDateFromInput && isDateAfter(entriesDateFromInput, value)) {
      setEntriesDateFromInput(value);
    }
  }

  if (isSummaryLoading && isEntriesLoading && !summaryDashboard) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="mr-2 animate-spin" size={18} />
          Carregando consolidado manual...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Consolidado manual
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Área isolada para registros manuais e acompanhamento por conta.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <button
            type="button"
            onClick={() => navigate("/consolidado-manual/novo")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <PlusCircle size={16} />
            Novo lançamento
          </button>

          <div className="flex overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("resumo")}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === "resumo"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-white"
              }`}
            >
              Dashboard
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("registros")}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === "registros"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-white"
              }`}
            >
              Base de registros
            </button>
          </div>
        </div>
      </div>

      {activeTab === "resumo" && (
        <div className="mt-6 space-y-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,0.8fr))_auto]">
            <CheckboxMultiSelect
              label="ID"
              emptyLabel="Todos os IDs"
              allSelectedLabel="Todos os IDs"
              selectedValues={summaryAccountIdsInput}
              onChange={setSummaryAccountIdsInput}
              options={ACCOUNT_FILTER_ITEMS.map((account) => ({
                value: account.code,
                label: account.code,
                description: account.companyName,
              }))}
            />

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Data inicial
              </label>
              <input
                type="date"
                value={summaryDateFromInput}
                max={summaryDateToInput || undefined}
                onChange={(event) =>
                  handleSummaryDateFromChange(event.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Data final
              </label>
              <input
                type="date"
                value={summaryDateToInput}
                min={summaryDateFromInput || undefined}
                onChange={(event) =>
                  handleSummaryDateToChange(event.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Status
              </label>
              <select
                value={summaryStatusInput}
                onChange={(event) =>
                  setSummaryStatusInput(
                    event.target.value as ManualConsolidadoStatusFilter,
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {MANUAL_CONSOLIDADO_STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleApplySummaryFilters}
              className="inline-flex items-center justify-center gap-2 self-end rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <CalendarRange size={16} />
              {isSummaryRefreshing ? "Atualizando..." : "Aplicar"}
            </button>
          </div>

          {summaryErrorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} />
                {summaryErrorMessage}
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full min-w-275 text-left">
              <thead className="bg-gray-50">
                <tr className="text-[11px] uppercase tracking-wide text-gray-700">
                  <th className="px-3 py-3 font-semibold">ID</th>
                  <th className="px-3 py-3 font-semibold">Saldo inicial</th>
                  <th className="px-3 py-3 font-semibold">Entradas</th>
                  <th className="px-3 py-3 font-semibold">Saídas</th>
                  <th className="px-3 py-3 font-semibold">Resgates</th>
                  <th className="px-3 py-3 font-semibold">Aplicações</th>
                  <th className="px-3 py-3 font-semibold">Entre contas</th>
                  <th className="px-3 py-3 font-semibold">Total</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {orderedSummaryRows.map((row) => (
                  <tr key={row.accountId} className="text-sm text-gray-700">
                    <td className="px-3 py-3 font-medium text-gray-900">
                      <div>{row.accountId}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        {row.companyName}
                      </div>
                    </td>

                    <td className={`${VALUE_CELL_CLASS} text-gray-900`}>
                      {formatCurrencyOrDash(row.initialBalance)}
                    </td>
                    <td
                      className={`${VALUE_CELL_CLASS} ${getPositiveValueColor(
                        row.entries,
                      )}`}
                    >
                      {formatCurrencyOrDash(row.entries)}
                    </td>
                    <td
                      className={`${VALUE_CELL_CLASS} ${getNegativeValueColor(
                        row.outputs,
                      )}`}
                    >
                      {formatNegativeCurrencyOrDash(row.outputs)}
                    </td>
                    <td
                      className={`${VALUE_CELL_CLASS} ${getPositiveValueColor(
                        row.rescues,
                      )}`}
                    >
                      {formatCurrencyOrDash(row.rescues)}
                    </td>
                    <td
                      className={`${VALUE_CELL_CLASS} ${getNegativeValueColor(
                        row.applications,
                      )}`}
                    >
                      {formatNegativeCurrencyOrDash(row.applications)}
                    </td>
                    <td
                      className={`${VALUE_CELL_CLASS} font-medium ${getSignedValueColor(
                        row.transferBetweenAccounts,
                      )}`}
                    >
                      {row.transferBetweenAccounts < 0
                        ? formatNegativeCurrencyOrDash(
                            Math.abs(row.transferBetweenAccounts),
                          )
                        : formatCurrencyOrDash(row.transferBetweenAccounts)}
                    </td>
                    <td
                      className={`${VALUE_CELL_CLASS} font-semibold ${getSignedValueColor(
                        row.total,
                      )}`}
                    >
                      {formatCurrencyOrDash(row.total)}
                    </td>
                  </tr>
                ))}

                {!orderedSummaryRows.length && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm text-gray-500"
                    >
                      Nenhum registro encontrado para os filtros informados.
                    </td>
                  </tr>
                )}
              </tbody>

              {summaryDashboard && (
                <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                  <tr className="text-sm font-bold text-gray-900">
                    <td className="px-3 py-3">Totais</td>
                    <td className={VALUE_CELL_CLASS}>
                      {formatCurrencyOrDash(
                        summaryDashboard.totals.initialBalance,
                      )}
                    </td>
                    <td className={`${VALUE_CELL_CLASS} text-emerald-600`}>
                      {formatCurrencyOrDash(summaryDashboard.totals.entries)}
                    </td>
                    <td className={`${VALUE_CELL_CLASS} text-red-600`}>
                      {formatNegativeCurrencyOrDash(
                        summaryDashboard.totals.outputs,
                      )}
                    </td>
                    <td className={`${VALUE_CELL_CLASS} text-emerald-600`}>
                      {formatCurrencyOrDash(summaryDashboard.totals.rescues)}
                    </td>
                    <td className={`${VALUE_CELL_CLASS} text-red-600`}>
                      {formatNegativeCurrencyOrDash(
                        summaryDashboard.totals.applications,
                      )}
                    </td>
                    <td
                      className={`${VALUE_CELL_CLASS} ${getSignedValueColor(
                        summaryDashboard.totals.transferBetweenAccounts,
                      )}`}
                    >
                      {summaryDashboard.totals.transferBetweenAccounts < 0
                        ? formatNegativeCurrencyOrDash(
                            Math.abs(
                              summaryDashboard.totals.transferBetweenAccounts,
                            ),
                          )
                        : formatCurrencyOrDash(
                            summaryDashboard.totals.transferBetweenAccounts,
                          )}
                    </td>
                    <td
                      className={`${VALUE_CELL_CLASS} ${getSignedValueColor(
                        summaryDashboard.totals.total,
                      )}`}
                    >
                      {formatCurrencyOrDash(summaryDashboard.totals.total)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {activeTab === "registros" && (
        <div className="mt-6 space-y-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,0.8fr))_minmax(0,0.8fr)]">
            <CheckboxMultiSelect
              label="ID"
              emptyLabel="Todos os IDs"
              allSelectedLabel="Todos os IDs"
              selectedValues={entriesAccountIdsInput}
              onChange={setEntriesAccountIdsInput}
              options={ACCOUNT_FILTER_ITEMS.map((account) => ({
                value: account.code,
                label: account.code,
                description: account.companyName,
              }))}
            />

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Data inicial
              </label>
              <input
                type="date"
                value={entriesDateFromInput}
                max={entriesDateToInput || undefined}
                onChange={(event) =>
                  handleEntriesDateFromChange(event.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Data final
              </label>
              <input
                type="date"
                value={entriesDateToInput}
                min={entriesDateFromInput || undefined}
                onChange={(event) =>
                  handleEntriesDateToChange(event.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Valor
              </label>
              <NumericFormat
                value={entriesAmountInput}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                allowNegative={false}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                onValueChange={(values) =>
                  setEntriesAmountInput(values.floatValue)
                }
              />
            </div>

            <div className="xl:col-span-2">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Histórico
              </label>
              <input
                type="text"
                value={entriesDescriptionInput}
                onChange={(event) =>
                  setEntriesDescriptionInput(event.target.value)
                }
                placeholder="Filtrar por histórico"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <CheckboxMultiSelect
              label="Atribuição"
              emptyLabel="Todas"
              allSelectedLabel="Todas"
              selectedValues={entriesAssignmentInput}
              onChange={(values) =>
                setEntriesAssignmentInput(
                  values as ManualConsolidadoAssignment[],
                )
              }
              options={MANUAL_CONSOLIDADO_ASSIGNMENT_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              widthClassName="w-72"
            />

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Status
              </label>
              <select
                value={entriesStatusInput}
                onChange={(event) =>
                  setEntriesStatusInput(
                    event.target.value as ManualConsolidadoStatusFilter,
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {MANUAL_CONSOLIDADO_STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Ordenacao
              </label>
              <select
                value={entriesDateOrderInput}
                onChange={(event) =>
                  setEntriesDateOrderInput(event.target.value as "asc" | "desc")
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="desc">Mais recentes</option>
                <option value="asc">Mais antigos</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleApplyEntryFilters}
              className="inline-flex items-center justify-center gap-2 self-end rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <CalendarRange size={16} />
              {isEntriesRefreshing ? "Atualizando..." : "Aplicar"}
            </button>

            <button
              type="button"
              onClick={handleClearEntryFilters}
              className="inline-flex items-center justify-center gap-2 self-end rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Limpar todos
            </button>
          </div>

          {entriesErrorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} />
                {entriesErrorMessage}
              </div>
            </div>
          )}

          {hasAppliedEntryFilters && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
              Total filtrado: {formatCurrency(entriesMeta.filteredAmount)}
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full min-w-7xl text-left">
              <thead className="bg-gray-50">
                <tr className="text-[11px] uppercase tracking-wide text-gray-700">
                  <th className="px-3 py-3 font-semibold">ID</th>
                  <th className="px-3 py-3 font-semibold">Empresa</th>
                  <th className="px-3 py-3 font-semibold">Data</th>
                  <th className="px-3 py-3 font-semibold">Montante</th>
                  <th className="px-3 py-3 font-semibold">Histórico</th>
                  <th className="px-3 py-3 font-semibold">Atribuição</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {entries.map((entry) => (
                  <tr key={entry.id} className="text-sm text-gray-700">
                    <td className="px-3 py-3 align-middle font-medium text-gray-900">
                      {entry.accountId}
                    </td>
                    <td className="px-3 py-3 align-middle">
                      {entry.companyName}
                    </td>
                    <td className="px-3 py-3 align-middle whitespace-nowrap">
                      {entry.date}
                    </td>
                    <td
                      className={`${VALUE_CELL_CLASS} align-middle font-medium text-gray-900`}
                    >
                      {formatCurrency(entry.amount)}
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <div className="max-w-sm wrap-break-word text-gray-700">
                        {entry.description}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {entry.assignment === "TRANSFERENCIA_EC" ? (
                        <div
                          className={`inline-flex min-w-52 items-center justify-center gap-1 rounded-full border px-4 py-1.5 text-center text-xs font-semibold ${getManualConsolidadoAssignmentClasses(
                            entry.assignment,
                          )}`}
                        >
                          <span>
                            {getManualConsolidadoAssignmentLabel(
                              entry.assignment,
                            )}
                          </span>
                          <span>(</span>
                          <span
                            className={
                              isTransferDirectionCredit(entry.transferDirection)
                                ? "text-emerald-600"
                                : "text-rose-600"
                            }
                          >
                            {isTransferDirectionCredit(entry.transferDirection)
                              ? "C"
                              : "D"}
                          </span>
                          <span>)</span>
                        </div>
                      ) : (
                        <div
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getManualConsolidadoAssignmentClasses(
                            entry.assignment,
                          )}`}
                        >
                          {getManualConsolidadoAssignmentLabel(
                            entry.assignment,
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={entry.status}
                        onChange={(event) =>
                          void handleStatusChange(
                            entry,
                            event.target.value as ManualConsolidadoStatus,
                          )
                        }
                        disabled={statusUpdatingId === entry.id}
                        className={`w-full rounded-xl border px-3 py-2 text-sm font-medium outline-none transition focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70 ${getManualConsolidadoStatusClasses(
                          entry.status,
                        )}`}
                      >
                        {MANUAL_CONSOLIDADO_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/consolidado-manual/${entry.id}/editar`)
                          }
                          className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                          <Pencil size={14} />
                          Editar
                        </button>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteConfirmId((current) =>
                                current === entry.id ? null : entry.id,
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                          >
                            <Trash2 size={14} />
                            Excluir
                          </button>

                          {deleteConfirmId === entry.id && (
                            <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-rose-200 bg-white p-3 shadow-lg">
                              <p className="text-sm font-semibold text-gray-900">
                                Excluir lanÃ§amento?
                              </p>
                              <p className="mt-1 whitespace-normal wrap-break-word text-xs leading-5 text-gray-500">
                                Esse registro sera removido da base manual e do
                                resumo desta Ã¡rea.
                              </p>

                              <div className="mt-3 flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleDeleteEntry(entry.id)
                                  }
                                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-rose-700"
                                >
                                  Confirmar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}

                {!entries.length && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm text-gray-500"
                    >
                      Nenhum lanÃ§amento encontrado para os filtros informados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Mostrando página {entriesMeta.page} de {entriesMeta.totalPages} •{" "}
              {entriesMeta.totalItems} registro(s)
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  void handleChangeEntriesPage(entriesMeta.page - 1)
                }
                disabled={entriesMeta.page <= 1 || isEntriesRefreshing}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() =>
                  void handleChangeEntriesPage(entriesMeta.page + 1)
                }
                disabled={
                  entriesMeta.page >= entriesMeta.totalPages ||
                  isEntriesRefreshing
                }
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
