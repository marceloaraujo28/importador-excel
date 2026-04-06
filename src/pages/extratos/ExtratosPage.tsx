import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Save,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  listExtratos,
  updateExtratos,
  exportExtratosFile,
} from "../../services/extratos.service";
import type {
  ExtractAssignment,
  ExtratoListItem,
  ListExtratosMeta,
} from "../../types/extrato";
import { NumericFormat } from "react-number-format";
import {
  BANK_FILTER_OPTIONS,
  ACCOUNT_FILTER_ITEMS,
} from "../../constants/account-filters";

type EditableExtratoRow = ExtratoListItem & {
  originalAssignment: ExtratoListItem["assignment"];
};

const assignmentOptions: Array<
  "TODAS" | Exclude<ExtractAssignment, "IGNORAR">
> = [
  "TODAS",
  "ENTRADAS",
  "SAÍDAS",
  "TARIFAS",
  "APLICAÇÕES",
  "RENDIMENTOS",
  "RESGATES",
  "TRANSFERÊNCIA EC",
  "OUTROS",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getAssignmentSelectClasses(assignment: string) {
  switch (assignment) {
    case "ENTRADAS":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 focus:border-emerald-500 focus:ring-emerald-100";
    case "SAÍDAS":
      return "border-rose-200 bg-rose-50 text-rose-700 focus:border-rose-500 focus:ring-rose-100";
    case "TARIFAS":
      return "border-amber-200 bg-amber-50 text-amber-700 focus:border-amber-500 focus:ring-amber-100";
    case "APLICAÇÕES":
      return "border-blue-200 bg-blue-50 text-blue-700 focus:border-blue-500 focus:ring-blue-100";
    case "RENDIMENTOS":
      return "border-green-500 bg-green-100 text-green-800 focus:border-green-800 focus:ring-green-200";
    case "RESGATES":
      return "border-purple-200 bg-purple-50 text-purple-700 focus:border-purple-500 focus:ring-purple-100";
    case "TRANSFERÊNCIA EC":
      return "border-indigo-200 bg-indigo-50 text-indigo-700 focus:border-indigo-500 focus:ring-indigo-100";
    default:
      return "border-gray-200 bg-gray-50 text-gray-700 focus:border-gray-500 focus:ring-gray-100";
  }
}

const defaultMeta: ListExtratosMeta = {
  page: 1,
  pageSize: 20,
  totalItems: 0,
  totalPages: 1,
};

export default function ExtratosPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<EditableExtratoRow[]>([]);
  const [meta, setMeta] = useState<ListExtratosMeta>(defaultMeta);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(
    null,
  );

  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);

  const [isAccountIdDropdownOpen, setIsAccountIdDropdownOpen] = useState(false);
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);

  const accountIdDropdownRef = useRef<HTMLDivElement | null>(null);
  const bankDropdownRef = useRef<HTMLDivElement | null>(null);

  const [assignmentFilter, setAssignmentFilter] = useState<
    "TODAS" | Exclude<ExtractAssignment, "IGNORAR">
  >("TODAS");
  const [dateOrder, setDateOrder] = useState<"asc" | "desc">("desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [value, setValue] = useState<number | undefined>(undefined);
  const [debouncedValue, setDebouncedValue] = useState(value);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const changedRows = useMemo(() => {
    return rows.filter((row) => row.assignment !== row.originalAssignment);
  }, [rows]);

  async function loadExtratos() {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setSaveSuccessMessage(null);

      const result = await listExtratos({
        page,
        pageSize,
        ...(assignmentFilter !== "TODAS"
          ? { assignment: assignmentFilter }
          : {}),
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
        dateOrder,
        ...(debouncedValue !== undefined ? { value: debouncedValue } : {}),
        ...(selectedAccountIds.length
          ? { accountIds: selectedAccountIds }
          : {}),
        ...(selectedBanks.length ? { bankNames: selectedBanks } : {}),
      });

      setRows(
        result.data.map((item) => ({
          ...item,
          originalAssignment: item.assignment,
        })),
      );
      setMeta(result.meta);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao carregar extratos.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [value]);

  useEffect(() => {
    loadExtratos();
  }, [
    page,
    pageSize,
    assignmentFilter,
    dateFrom,
    dateTo,
    dateOrder,
    debouncedValue,
    selectedAccountIds,
    selectedBanks,
  ]);

  function handleToggleAccountId(accountId: string) {
    setSelectedAccountIds((current) =>
      current.includes(accountId)
        ? current.filter((id) => id !== accountId)
        : [...current, accountId],
    );
    setPage(1);
  }

  function handleToggleBank(bankName: string) {
    setSelectedBanks((current) =>
      current.includes(bankName)
        ? current.filter((bank) => bank !== bankName)
        : [...current, bankName],
    );
    setPage(1);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        accountIdDropdownRef.current &&
        !accountIdDropdownRef.current.contains(target)
      ) {
        setIsAccountIdDropdownOpen(false);
      }

      if (
        bankDropdownRef.current &&
        !bankDropdownRef.current.contains(target)
      ) {
        setIsBankDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function handleExport() {
    try {
      setIsExporting(true);
      setErrorMessage(null);

      const blob = await exportExtratosFile({
        ...(assignmentFilter !== "TODAS"
          ? { assignment: assignmentFilter }
          : {}),
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
        dateOrder,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "extratos.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao exportar extratos.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  function handleAssignmentChange(
    id: string,
    assignment: Exclude<ExtractAssignment, "IGNORAR">,
  ) {
    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              assignment,
            }
          : row,
      ),
    );
  }

  async function handleSaveChanges() {
    if (!changedRows.length) return;

    try {
      setIsSaving(true);
      setErrorMessage(null);
      setSaveSuccessMessage(null);

      const result = await updateExtratos({
        updates: changedRows.map((row) => ({
          id: row.id,
          assignment: row.assignment,
        })),
      });

      setRows((current) =>
        current.map((row) =>
          changedRows.some((changed) => changed.id === row.id)
            ? {
                ...row,
                originalAssignment: row.assignment,
              }
            : row,
        ),
      );

      setSaveSuccessMessage(
        `${result.updatedCount} extrato(s) atualizado(s) com sucesso.`,
      );

      await loadExtratos();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao atualizar extratos.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleClearFilters() {
    setAssignmentFilter("TODAS");
    setDateOrder("desc");
    setDateFrom("");
    setDateTo("");
    setValue(undefined);
    setSelectedAccountIds([]);
    setSelectedBanks([]);
    setPage(1);
  }

  function handlePreviousPage() {
    setPage((current) => Math.max(1, current - 1));
  }

  function handleNextPage() {
    setPage((current) => Math.min(meta.totalPages, current + 1));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-800 sm:text-2xl">
            Extratos
          </h2>
          <p className="text-sm text-gray-500">
            Gerencie os lançamentos bancários
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download size={16} />
                Exportar
              </>
            )}
          </button>

          <button
            onClick={() => navigate("/extratos/importar")}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
          >
            <Upload size={16} />
            Importar
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:p-5">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              Lançamentos salvos
            </h3>
            <p className="text-sm text-gray-500">
              Visualização paginada dos extratos já confirmados.
            </p>
          </div>

          {/* ===== FILTROS ===== */}

          {/* LINHA 1 */}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {/* ID */}
            <div ref={accountIdDropdownRef} className="relative">
              <label className="mb-1 text-xs text-gray-500">ID Conta</label>
              <button
                type="button"
                onClick={() => setIsAccountIdDropdownOpen((c) => !c)}
                className="flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm"
              >
                {selectedAccountIds.length === 0
                  ? "Todos os IDs"
                  : `${selectedAccountIds.length} selecionado(s)`}
                <ChevronDown size={16} />
              </button>

              {isAccountIdDropdownOpen && (
                <div className="absolute z-20 mt-2 w-full rounded-xl border bg-white p-2 shadow">
                  <div className="max-h-72 overflow-y-auto">
                    {ACCOUNT_FILTER_ITEMS.map((account) => {
                      const checked = selectedAccountIds.includes(account.code);

                      return (
                        <label
                          key={account.code}
                          className="flex gap-2 px-2 py-2 text-sm hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleAccountId(account.code)}
                          />
                          <div>
                            <p>{account.code}</p>
                            <p className="text-xs text-gray-500">
                              {account.bankName}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* BANCO */}
            <div ref={bankDropdownRef} className="relative">
              <label className="mb-1 text-xs text-gray-500">Banco</label>
              <button
                type="button"
                onClick={() => setIsBankDropdownOpen((c) => !c)}
                className="flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm"
              >
                {selectedBanks.length === 0
                  ? "Todos os bancos"
                  : `${selectedBanks.length} selecionado(s)`}
                <ChevronDown size={16} />
              </button>

              {isBankDropdownOpen && (
                <div className="absolute z-20 mt-2 w-full rounded-xl border bg-white p-2 shadow">
                  {BANK_FILTER_OPTIONS.map((bank) => {
                    const checked = selectedBanks.includes(bank);

                    return (
                      <label
                        key={bank}
                        className="flex gap-2 px-2 py-2 text-sm hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleBank(bank)}
                        />
                        {bank}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* VALOR */}
            <div>
              <label className="mb-1 text-xs text-gray-500">Valor</label>
              <NumericFormat
                value={value}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                onValueChange={(v) => setValue(v.floatValue)}
              />
            </div>

            {/* ATRIBUIÇÃO */}
            <div>
              <label className="mb-1 text-xs text-gray-500">Atribuição</label>
              <select
                value={assignmentFilter}
                onChange={(e) => setAssignmentFilter(e.target.value as any)}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              >
                {assignmentOptions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>

          {/* LINHA 2 */}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Data inicial
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Data final
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Ordenação
              </label>
              <select
                value={dateOrder}
                onChange={(e) => setDateOrder(e.target.value as any)}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              >
                <option value="desc">Mais recentes</option>
                <option value="asc">Mais antigas</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Por página
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                className="w-full rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
              >
                Limpar filtros
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-500">
            Mostrando página{" "}
            <span className="font-medium text-gray-700">{meta.page}</span> de{" "}
            <span className="font-medium text-gray-700">{meta.totalPages}</span>{" "}
            —{" "}
            <span className="font-medium text-gray-700">{meta.totalItems}</span>{" "}
            item(ns)
          </div>

          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={!changedRows.length || isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={16} />
                Salvar alterações ({changedRows.length})
              </>
            )}
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {saveSuccessMessage && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {saveSuccessMessage}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="mr-2 animate-spin" size={18} />
            Carregando extratos...
          </div>
        ) : rows.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            Nenhum extrato encontrado.
          </div>
        ) : (
          <>
            <div className="mt-5 w-full overflow-x-auto">
              <table className="w-full min-w-280 text-left">
                <thead className="bg-gray-50">
                  <tr className="text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3 font-medium">ID Conta</th>
                    <th className="px-4 py-3 font-medium">Banco</th>
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 font-medium">Histórico</th>
                    <th className="px-4 py-3 font-medium">Valor</th>
                    <th className="px-4 py-3 font-medium">Atribuição</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="w-22.5 whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-800">
                        {row.accountId}
                      </td>

                      <td className="w-47.5 whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                        {row.bankName}
                      </td>

                      <td className="w-32.5 whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                        {row.date}
                      </td>

                      <td className="w-full min-w-[320px] px-4 py-4 text-sm text-gray-700">
                        {row.description}
                      </td>

                      <td className="w-37.5 whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-800">
                        {formatCurrency(row.amount)}
                      </td>

                      <td className="w-65 whitespace-nowrap px-4 py-4 text-sm">
                        <select
                          value={row.assignment}
                          onChange={(event) =>
                            handleAssignmentChange(
                              row.id,
                              event.target.value as Exclude<
                                ExtractAssignment,
                                "IGNORAR"
                              >,
                            )
                          }
                          className={`w-full min-w-55 rounded-xl border px-3 py-2 text-sm font-medium outline-none transition focus:ring-2 ${getAssignmentSelectClasses(
                            row.assignment,
                          )}`}
                        >
                          {assignmentOptions
                            .filter((option) => option !== "TODAS")
                            .map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-500">
                Página{" "}
                <span className="font-medium text-gray-700">{meta.page}</span>{" "}
                de{" "}
                <span className="font-medium text-gray-700">
                  {meta.totalPages}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePreviousPage}
                  disabled={meta.page <= 1}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ChevronLeft size={16} />
                  Anterior
                </button>

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={meta.page >= meta.totalPages}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Próxima
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
