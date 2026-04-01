import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  FileSpreadsheet,
  Save,
  Trash2,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { confirmExtractReview } from "../../services/extratos.service";
import type {
  ExtractAssignment,
  ImportedFileResult,
  ImportedTransaction,
} from "../../types/extrato";

type LocationState = {
  importedFiles?: ImportedFileResult[];
};

const assignmentOptions: ExtractAssignment[] = [
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

function parsePtBrDateToTimestamp(date: string) {
  const [day, month, year] = date.split("/").map(Number);

  if (!day || !month || !year) {
    return 0;
  }

  return new Date(year, month - 1, day).getTime();
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

export default function RevisaoExtratosPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const importedFiles = state?.importedFiles ?? [];
  const filesWithError = importedFiles.filter((file) => file.error);

  const initialRows = useMemo(() => {
    const allTransactions: ImportedTransaction[] = [];

    for (const file of importedFiles) {
      if (file.transactions?.length) {
        allTransactions.push(...file.transactions);
      }
    }

    return allTransactions;
  }, [importedFiles]);

  const [rows, setRows] = useState<ImportedTransaction[]>(initialRows);
  const [assignmentFilter, setAssignmentFilter] = useState<
    "TODAS" | ExtractAssignment
  >("TODAS");
  const [dateOrder, setDateOrder] = useState<"DESC" | "ASC">("DESC");
  const [isSaving, setIsSaving] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const filteredRows = useMemo(() => {
    let result = [...rows];

    if (assignmentFilter !== "TODAS") {
      result = result.filter((row) => row.assignment === assignmentFilter);
    }

    result.sort((a, b) => {
      const aTime = parsePtBrDateToTimestamp(a.date);
      const bTime = parsePtBrDateToTimestamp(b.date);

      return dateOrder === "DESC" ? bTime - aTime : aTime - bTime;
    });

    return result;
  }, [rows, assignmentFilter, dateOrder]);

  function handleAssignmentChange(
    indexToUpdate: number,
    assignment: ExtractAssignment,
  ) {
    setRows((current) =>
      current.map((row, index) =>
        index === indexToUpdate
          ? {
              ...row,
              assignment,
            }
          : row,
      ),
    );
  }

  function handleRemoveRow(indexToRemove: number) {
    setRows((current) => current.filter((_, index) => index !== indexToRemove));
  }

  async function handleSaveReview() {
    try {
      setIsSaving(true);
      setSaveErrorMessage(null);

      await confirmExtractReview({
        transactions: rows,
      });

      navigate("/extratos");
    } catch (error) {
      setSaveErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao salvar revisão dos extratos.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!importedFiles.length) {
    return (
      <div className="space-y-6">
        <div>
          <button
            type="button"
            onClick={() => navigate("/extratos/importar")}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-700"
          >
            <ArrowLeft size={16} />
            Voltar para importação
          </button>

          <h2 className="text-xl font-semibold text-gray-800 sm:text-2xl">
            Revisão dos extratos
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Nenhum dado de importação foi encontrado.
          </p>
        </div>

        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">
            Faça uma nova importação para visualizar a revisão.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => navigate("/extratos/importar")}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-700"
          >
            <ArrowLeft size={16} />
            Voltar para importação
          </button>

          <h2 className="text-xl font-semibold text-gray-800 sm:text-2xl">
            Revisão dos extratos
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Revise os lançamentos identificados antes de salvar no sistema.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Arquivos
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-800">
              {importedFiles.length}
            </p>
          </div>

          <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Lançamentos
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-800">
              {rows.length}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveReview}
            disabled={!rows.length || isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={18} />
            {isSaving ? "Salvando..." : "Salvar revisão"}
          </button>
        </div>
      </div>

      {filesWithError.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 text-amber-600" size={18} />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-amber-800">
                Alguns arquivos não puderam ser processados
              </h3>

              <div className="space-y-2">
                {filesWithError.map((file) => (
                  <div
                    key={file.fileName}
                    className="rounded-xl bg-white/70 p-3 ring-1 ring-amber-200"
                  >
                    <p className="text-sm font-medium text-gray-800">
                      {file.fileName}
                    </p>
                    <p className="mt-1 text-sm text-amber-700">{file.error}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {saveErrorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {saveErrorMessage}
        </div>
      )}

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={18} className="text-gray-500" />
              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  Lançamentos para revisão
                </h3>
                <p className="text-sm text-gray-500">
                  Ajuste as atribuições e remova linhas, se necessário.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Filtrar atribuição
              </label>
              <select
                value={assignmentFilter}
                onChange={(event) =>
                  setAssignmentFilter(
                    event.target.value as "TODAS" | ExtractAssignment,
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="TODAS">Todas</option>
                {assignmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Ordenar por data
              </label>
              <select
                value={dateOrder}
                onChange={(event) =>
                  setDateOrder(event.target.value as "DESC" | "ASC")
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="DESC">Mais recentes primeiro</option>
                <option value="ASC">Mais antigas primeiro</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-5 w-full overflow-x-auto">
          <table className="w-full min-w-262.5 text-left">
            <thead className="bg-gray-50">
              <tr className="text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Banco</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Histórico</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Atribuição</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredRows.map((row) => {
                const originalIndex = rows.findIndex(
                  (currentRow) => currentRow === row,
                );

                return (
                  <tr
                    key={`${row.accountId}-${row.date}-${row.description}-${row.amount}-${originalIndex}`}
                    className="align-top"
                  >
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
                            originalIndex,
                            event.target.value as ExtractAssignment,
                          )
                        }
                        className={`w-full min-w-55 rounded-xl border px-3 py-2 text-sm font-medium outline-none transition focus:ring-2 ${getAssignmentSelectClasses(
                          row.assignment,
                        )}`}
                      >
                        {assignmentOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="w-35 whitespace-nowrap px-4 py-4 text-sm">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(originalIndex)}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                      >
                        <Trash2 size={16} />
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-gray-500"
                  >
                    Nenhum lançamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
