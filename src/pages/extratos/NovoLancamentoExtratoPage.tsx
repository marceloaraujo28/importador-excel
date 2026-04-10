import { useMemo, useState } from "react";
import { ArrowLeft, Loader2, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NumericFormat } from "react-number-format";
import { createExtratos } from "../../services/extratos.service";
import {
  ACCOUNT_FILTER_ITEMS,
  type AccountFilterItem,
} from "../../constants/account-filters";
import type { ExtractAssignment, ExtractSignal } from "../../types/extrato";

const assignmentOptions: Array<Exclude<ExtractAssignment, "IGNORAR">> = [
  "ENTRADAS",
  "SAÍDAS",
  "TARIFAS",
  "APLICAÇÕES",
  "RENDIMENTOS",
  "RENDIMENTO MENSAL",
  "RESGATES",
  "TRANSFERÊNCIA EC",
  "OUTROS",
];

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
    case "RENDIMENTO MENSAL":
      return "border-green-500 bg-green-100 text-green-800 focus:border-green-800 focus:ring-green-200";
    case "RESGATES":
      return "border-purple-200 bg-purple-50 text-purple-700 focus:border-purple-500 focus:ring-purple-100";
    case "TRANSFERÊNCIA EC":
      return "border-indigo-200 bg-indigo-50 text-indigo-700 focus:border-indigo-500 focus:ring-indigo-100";
    default:
      return "border-gray-200 bg-gray-50 text-gray-700 focus:border-gray-500 focus:ring-gray-100";
  }
}

function formatDateInputToPtBr(date: string) {
  const [year, month, day] = date.split("-");

  if (!year || !month || !day) {
    return "";
  }

  return `${day}/${month}/${year}`;
}

function getSignalForAssignment(
  assignment: Exclude<ExtractAssignment, "IGNORAR">,
  transferSignal: ExtractSignal,
): ExtractSignal {
  switch (assignment) {
    case "ENTRADAS":
    case "RENDIMENTOS":
    case "RENDIMENTO MENSAL":
    case "RESGATES":
      return "C";
    case "SAÍDAS":
    case "TARIFAS":
    case "APLICAÇÕES":
      return "D";
    case "TRANSFERÊNCIA EC":
      return transferSignal;
    default:
      return "D";
  }
}

export default function NovoLancamentoExtratoPage() {
  const navigate = useNavigate();

  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [assignment, setAssignment] =
    useState<Exclude<ExtractAssignment, "IGNORAR">>("ENTRADAS");
  const [transferSignal, setTransferSignal] = useState<ExtractSignal>("C");
  const [ignoreDailySummary, setIgnoreDailySummary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedAccount = useMemo<AccountFilterItem | null>(
    () => ACCOUNT_FILTER_ITEMS.find((item) => item.code === accountId) ?? null,
    [accountId],
  );

  const isTransfer = assignment === "TRANSFERÊNCIA EC";

  async function handleSave() {
    if (!selectedAccount) {
      setErrorMessage("Selecione um ID de conta.");
      return;
    }

    if (!date) {
      setErrorMessage("Informe a data do lançamento.");
      return;
    }

    if (!description.trim()) {
      setErrorMessage("Informe o histórico do lançamento.");
      return;
    }

    if (amount === undefined || amount <= 0) {
      setErrorMessage("Informe um valor válido.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      await createExtratos({
        transactions: [
          {
            accountId: selectedAccount.code,
            bankName: selectedAccount.bankName,
            companyName: selectedAccount.companyName,
            date: formatDateInputToPtBr(date),
            description: description.trim(),
            amount: Number(amount.toFixed(2)),
            assignment,
            signal: getSignalForAssignment(assignment, transferSignal),
            ignoreDailySummary,
          },
        ],
      });

      navigate("/extratos");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao salvar lançamento manual.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={() => navigate("/extratos")}
          className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-700"
        >
          <ArrowLeft size={16} />
          Voltar para extratos
        </button>

        <h2 className="text-xl font-semibold text-gray-800 sm:text-2xl">
          Novo lançamento
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Cadastre um lançamento manual e escolha se ele deve ou não entrar no
          consolidado.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
              ID da conta
            </label>
            <select
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Selecione uma conta</option>
              {ACCOUNT_FILTER_ITEMS.map((account) => (
                <option key={account.code} value={account.code}>
                  {account.code} - {account.bankName}
                </option>
              ))}
            </select>

            {selectedAccount && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-gray-50 px-4 py-3 ring-1 ring-gray-200">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Banco
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {selectedAccount.bankName}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 px-4 py-3 ring-1 ring-gray-200">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Empresa
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {selectedAccount.companyName}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
              Valor
            </label>
            <NumericFormat
              value={amount}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              allowNegative={false}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              onValueChange={(values) => setAmount(values.floatValue)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
              Histórico
            </label>
            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descreva o lançamento"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
              Atribuição
            </label>
            <select
              value={assignment}
              onChange={(event) =>
                setAssignment(
                  event.target.value as Exclude<ExtractAssignment, "IGNORAR">,
                )
              }
              className={`w-full rounded-xl border px-3 py-2.5 text-sm font-medium outline-none transition focus:ring-2 ${getAssignmentSelectClasses(
                assignment,
              )}`}
            >
              {assignmentOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {isTransfer && (
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Direção da transferência
              </label>
              <select
                value={transferSignal}
                onChange={(event) =>
                  setTransferSignal(event.target.value as ExtractSignal)
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="C">Entrada</option>
                <option value="D">Saída</option>
              </select>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={ignoreDailySummary}
                onChange={(event) =>
                  setIgnoreDailySummary(event.target.checked)
                }
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                Não enviar para o consolidado
                <span className="mt-1 block text-xs text-gray-500">
                  Use apenas quando esse lançamento precisar aparecer em
                  extratos, mas não deve impactar o dashboard.
                </span>
              </span>
            </label>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate("/extratos")}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <PlusCircle size={16} />
                Salvar lançamento
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
