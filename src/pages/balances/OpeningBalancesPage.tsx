import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Save, Search } from "lucide-react";
import { NumericFormat } from "react-number-format";
import {
  listOpeningBalances,
  updateOpeningBalance,
} from "../../services/opening-balances.service";
import type { OpeningBalanceItem } from "../../types/opening-balance";

type EditableOpeningBalanceRow = OpeningBalanceItem & {
  isSaving?: boolean;
  successMessage?: string | null;
  errorMessage?: string | null;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function OpeningBalancesPage() {
  const [rows, setRows] = useState<EditableOpeningBalanceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState("TODOS");
  const [companyFilter, setCompanyFilter] = useState("TODAS");

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setPageError(null);

        const result = await listOpeningBalances();

        setRows(
          result.data.map((item) => ({
            ...item,
            isSaving: false,
            successMessage: null,
            errorMessage: null,
          })),
        );
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Erro ao carregar saldos iniciais.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const groupOptions = useMemo(() => {
    return ["TODOS", ...new Set(rows.map((row) => row.groupName))];
  }, [rows]);

  const companyOptions = useMemo(() => {
    const filteredByGroup =
      groupFilter === "TODOS"
        ? rows
        : rows.filter((row) => row.groupName === groupFilter);

    return ["TODAS", ...new Set(filteredByGroup.map((row) => row.companyName))];
  }, [rows, groupFilter]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch =
        !searchTerm.trim() ||
        row.accountId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.companyName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesGroup =
        groupFilter === "TODOS" || row.groupName === groupFilter;

      const matchesCompany =
        companyFilter === "TODAS" || row.companyName === companyFilter;

      return matchesSearch && matchesGroup && matchesCompany;
    });
  }, [rows, searchTerm, groupFilter, companyFilter]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        acc.initialAvailable += row.initialAvailable;
        acc.initialApplication += row.initialApplication;
        return acc;
      },
      {
        initialAvailable: 0,
        initialApplication: 0,
      },
    );
  }, [filteredRows]);

  function updateRow(
    accountId: string,
    updater: (row: EditableOpeningBalanceRow) => EditableOpeningBalanceRow,
  ) {
    setRows((current) =>
      current.map((row) => (row.accountId === accountId ? updater(row) : row)),
    );
  }

  function handleDateChange(accountId: string, value: string) {
    updateRow(accountId, (row) => ({
      ...row,
      referenceDate: value || null,
      successMessage: null,
      errorMessage: null,
    }));
  }

  function handleAvailableChange(accountId: string, value?: number) {
    updateRow(accountId, (row) => ({
      ...row,
      initialAvailable: value ?? 0,
      successMessage: null,
      errorMessage: null,
    }));
  }

  function handleApplicationChange(accountId: string, value?: number) {
    updateRow(accountId, (row) => ({
      ...row,
      initialApplication: value ?? 0,
      successMessage: null,
      errorMessage: null,
    }));
  }

  async function handleSaveRow(row: EditableOpeningBalanceRow) {
    try {
      updateRow(row.accountId, (current) => ({
        ...current,
        isSaving: true,
        successMessage: null,
        errorMessage: null,
      }));

      const result = await updateOpeningBalance(row.accountId, {
        referenceDate: row.referenceDate,
        initialAvailable: row.initialAvailable,
        initialApplication: row.initialApplication,
      });

      updateRow(row.accountId, (current) => ({
        ...current,
        referenceDate: result.data.referenceDate,
        initialAvailable: result.data.initialAvailable,
        initialApplication: result.data.initialApplication,
        isSaving: false,
        successMessage: "Salvo com sucesso.",
        errorMessage: null,
      }));
    } catch (error) {
      updateRow(row.accountId, (current) => ({
        ...current,
        isSaving: false,
        successMessage: null,
        errorMessage:
          error instanceof Error
            ? error.message
            : "Erro ao salvar saldo inicial.",
      }));
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Saldos Iniciais
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure o saldo inicial de conta corrente e aplicações por
              conta.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Contas filtradas
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {filteredRows.length}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Disponível inicial
              </p>
              <p className="mt-1 text-lg font-semibold text-emerald-600">
                {formatCurrency(totals.initialAvailable)}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Aplicação inicial
              </p>
              <p className="mt-1 text-lg font-semibold text-blue-600">
                {formatCurrency(totals.initialApplication)}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Total inicial
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {formatCurrency(
                  totals.initialAvailable + totals.initialApplication,
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
              Buscar
            </label>
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Conta, banco ou empresa"
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
              Grupo
            </label>
            <select
              value={groupFilter}
              onChange={(event) => {
                setGroupFilter(event.target.value);
                setCompanyFilter("TODAS");
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {groupOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
              Empresa
            </label>
            <select
              value={companyFilter}
              onChange={(event) => setCompanyFilter(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {companyOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {pageError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            {pageError}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="mr-2 animate-spin" size={18} />
            Carregando saldos iniciais...
          </div>
        ) : (
          <table className="min-w-300 w-full text-left">
            <thead className="bg-gray-50">
              <tr className="text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-medium">Conta</th>
                <th className="px-4 py-3 font-medium">Grupo</th>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">Banco</th>
                <th className="px-4 py-3 font-medium">Data referência</th>
                <th className="px-4 py-3 font-medium">Disponível inicial</th>
                <th className="px-4 py-3 font-medium">Aplicação inicial</th>
                <th className="px-4 py-3 font-medium">Total inicial</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredRows.map((row) => (
                <tr key={row.accountId} className="align-top">
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-900">
                    {row.accountId}
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                    {row.groupName}
                  </td>

                  <td className="min-w-65 px-4 py-4 text-sm text-gray-700">
                    {row.companyName}
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                    {row.bankName}
                  </td>

                  <td className="px-4 py-4 text-sm">
                    <input
                      type="date"
                      value={row.referenceDate ?? ""}
                      onChange={(event) =>
                        handleDateChange(row.accountId, event.target.value)
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </td>

                  <td className="px-4 py-4 text-sm">
                    <NumericFormat
                      value={row.initialAvailable}
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="R$ "
                      decimalScale={2}
                      allowNegative={false}
                      onValueChange={(values) =>
                        handleAvailableChange(row.accountId, values.floatValue)
                      }
                      className="w-full min-w-40 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </td>

                  <td className="px-4 py-4 text-sm">
                    <NumericFormat
                      value={row.initialApplication}
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="R$ "
                      decimalScale={2}
                      allowNegative={false}
                      onValueChange={(values) =>
                        handleApplicationChange(
                          row.accountId,
                          values.floatValue,
                        )
                      }
                      className="w-full min-w-40 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-900">
                    {formatCurrency(
                      row.initialAvailable + row.initialApplication,
                    )}
                  </td>

                  <td className="px-4 py-4 text-sm">
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveRow(row)}
                        disabled={row.isSaving}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {row.isSaving ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            Salvar
                          </>
                        )}
                      </button>

                      {row.successMessage && (
                        <span className="text-xs text-emerald-600">
                          {row.successMessage}
                        </span>
                      )}

                      {row.errorMessage && (
                        <span className="text-xs text-red-600">
                          {row.errorMessage}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    Nenhuma conta encontrada para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
