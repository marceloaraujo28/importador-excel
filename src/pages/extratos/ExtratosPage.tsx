import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { listExtratos } from "../../services/extratos.service";
import type { ExtractAssignment, ExtratoListItem } from "../../types/extrato";

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

function getAssignmentBadgeClasses(assignment: string) {
  switch (assignment) {
    case "ENTRADAS":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
    case "SAÍDAS":
      return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200";
    case "TARIFAS":
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
    case "APLICAÇÕES":
      return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200";
    case "RESGATES":
      return "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200";
    case "TRANSFERÊNCIA EC":
      return "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200";
    default:
      return "bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-200";
  }
}

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

export default function ExtratosPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<ExtratoListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [assignmentFilter, setAssignmentFilter] = useState<
    "TODAS" | Exclude<ExtractAssignment, "IGNORAR">
  >("TODAS");
  const [dateOrder, setDateOrder] = useState<"DESC" | "ASC">("DESC");

  useEffect(() => {
    async function loadExtratos() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const result = await listExtratos();
        setRows(result.data);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Erro ao carregar extratos.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadExtratos();
  }, []);

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
          <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-gray-50 sm:w-auto">
            <Download size={16} />
            Exportar
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              Lançamentos salvos
            </h3>
            <p className="text-sm text-gray-500">
              Visualização dos extratos já confirmados.
            </p>
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
                    event.target.value as
                      | "TODAS"
                      | Exclude<ExtractAssignment, "IGNORAR">,
                  )
                }
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

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="mr-2 animate-spin" size={18} />
            Carregando extratos...
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            Nenhum extrato encontrado.
          </div>
        ) : (
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
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredRows.map((row) => (
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

                    <td className="w-55 whitespace-nowrap px-4 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getAssignmentBadgeClasses(
                          row.assignment,
                        )}`}
                      >
                        {row.assignment}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
