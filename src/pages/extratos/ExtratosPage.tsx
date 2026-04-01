import { useEffect, useMemo, useState } from "react";
import {
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

  const [assignmentFilter, setAssignmentFilter] = useState<
    "TODAS" | Exclude<ExtractAssignment, "IGNORAR">
  >("TODAS");
  const [dateOrder, setDateOrder] = useState<"asc" | "desc">("desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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
    loadExtratos();
  }, [page, pageSize, assignmentFilter, dateFrom, dateTo, dateOrder]);

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
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              Lançamentos salvos
            </h3>
            <p className="text-sm text-gray-500">
              Visualização paginada dos extratos já confirmados.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Atribuição
              </label>
              <select
                value={assignmentFilter}
                onChange={(event) => {
                  setAssignmentFilter(
                    event.target.value as
                      | "TODAS"
                      | Exclude<ExtractAssignment, "IGNORAR">,
                  );
                  setPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {assignmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Data inicial
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => {
                  setDateFrom(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Data final
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => {
                  setDateTo(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Ordenação
              </label>
              <select
                value={dateOrder}
                onChange={(event) => {
                  setDateOrder(event.target.value as "asc" | "desc");
                  setPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Limpar filtros
            </button>
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
