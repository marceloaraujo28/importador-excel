import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, PlusCircle, Save } from "lucide-react";
import { NumericFormat } from "react-number-format";
import { useNavigate, useParams } from "react-router-dom";
import {
  ACCOUNT_FILTER_ITEMS,
  type AccountFilterItem,
} from "../../constants/account-filters";
import {
  getManualConsolidadoAssignmentClasses,
  MANUAL_CONSOLIDADO_ASSIGNMENT_OPTIONS,
  MANUAL_CONSOLIDADO_STATUS_OPTIONS,
  MANUAL_CONSOLIDADO_TRANSFER_DIRECTION_OPTIONS,
} from "../../constants/manual-consolidado";
import {
  createManualConsolidadoEntry,
  getManualConsolidadoEntry,
  updateManualConsolidadoEntry,
} from "../../services/manual-consolidado.service";
import type {
  ManualConsolidadoAssignment,
  ManualConsolidadoStatus,
  ManualConsolidadoTransferDirection,
} from "../../types/manual-consolidado";

function formatDateInputToPtBr(date: string) {
  const [year, month, day] = date.split("-");

  if (!year || !month || !day) {
    return "";
  }

  return `${day}/${month}/${year}`;
}

function formatPtBrDateToInput(date: string) {
  const [day, month, year] = date.split("/");

  if (!day || !month || !year) {
    return "";
  }

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export default function ManualConsolidadoFormPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const isEditing = Boolean(params.id);

  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [assignment, setAssignment] =
    useState<ManualConsolidadoAssignment>("ENTRADAS");
  const [transferDirection, setTransferDirection] =
    useState<ManualConsolidadoTransferDirection>("ENTRADA");
  const [status, setStatus] =
    useState<ManualConsolidadoStatus>("NAO_AUTORIZADO");
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedAccount = useMemo<AccountFilterItem | null>(
    () => ACCOUNT_FILTER_ITEMS.find((item) => item.code === accountId) ?? null,
    [accountId],
  );

  const isTransfer = assignment === "TRANSFERENCIA_EC";

  useEffect(() => {
    async function loadEntry() {
      if (!params.id) {
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);

        const result = await getManualConsolidadoEntry(params.id);
        const entry = result.data;

        setAccountId(entry.accountId);
        setDate(formatPtBrDateToInput(entry.date));
        setDescription(entry.description);
        setAmount(entry.amount);
        setAssignment(entry.assignment);
        setTransferDirection(entry.transferDirection ?? "ENTRADA");
        setStatus(entry.status);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Erro ao carregar lancamento manual.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadEntry();
  }, [params.id]);

  async function handleSave() {
    if (!selectedAccount) {
      setErrorMessage("Selecione um ID de conta.");
      return;
    }

    if (!date) {
      setErrorMessage("Informe a data do lancamento.");
      return;
    }

    if (!description.trim()) {
      setErrorMessage("Informe a descricao do lancamento.");
      return;
    }

    if (amount === undefined || amount <= 0) {
      setErrorMessage("Informe um valor valido.");
      return;
    }

    if (isTransfer && !transferDirection) {
      setErrorMessage("Informe a direcao da transferencia.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const payload = {
        accountId: selectedAccount.code,
        date: formatDateInputToPtBr(date),
        amount: Number(amount.toFixed(2)),
        description: description.trim(),
        assignment,
        transferDirection: isTransfer ? transferDirection : null,
      };

      if (params.id) {
        await updateManualConsolidadoEntry(params.id, {
          ...payload,
          status,
        });
      } else {
        await createManualConsolidadoEntry(payload);
      }

      navigate("/consolidado-manual", {
        state: { tab: "registros" },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao salvar lancamento manual.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="mr-2 animate-spin" size={18} />
          Carregando lancamento manual...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={() =>
            navigate("/consolidado-manual", {
              state: { tab: "registros" },
            })
          }
          className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-700"
        >
          <ArrowLeft size={16} />
          Voltar para consolidado manual
        </button>

        <h2 className="text-xl font-semibold text-gray-800 sm:text-2xl">
          {isEditing ? "Editar lancamento manual" : "Novo lancamento manual"}
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {isEditing
            ? "Atualize os dados do registro manual."
            : "Cadastre um novo registro para compor o consolidado manual."}
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
              {[...ACCOUNT_FILTER_ITEMS]
                .sort((a, b) => a.code.localeCompare(b.code))
                .map((account) => (
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
              Descricao
            </label>
            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descreva o lancamento"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
              Classificacao
            </label>
            <select
              value={assignment}
              onChange={(event) =>
                setAssignment(event.target.value as ManualConsolidadoAssignment)
              }
              className={`w-full rounded-xl border px-3 py-2.5 text-sm font-medium outline-none transition focus:ring-2 ${getManualConsolidadoAssignmentClasses(
                assignment,
              )}`}
            >
              {MANUAL_CONSOLIDADO_ASSIGNMENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {isTransfer && (
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Direcao da transferencia
              </label>
              <select
                value={transferDirection}
                onChange={(event) =>
                  setTransferDirection(
                    event.target.value as ManualConsolidadoTransferDirection,
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {MANUAL_CONSOLIDADO_TRANSFER_DIRECTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
              Status
            </label>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as ManualConsolidadoStatus)
              }
              disabled={!isEditing}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-80"
            >
              {MANUAL_CONSOLIDADO_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {!isEditing && (
              <p className="mt-2 text-xs text-gray-500">
                Todo novo lancamento nasce como nao autorizado.
              </p>
            )}
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
            onClick={() =>
              navigate("/consolidado-manual", {
                state: { tab: "registros" },
              })
            }
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
            ) : isEditing ? (
              <>
                <Save size={16} />
                Salvar alteracoes
              </>
            ) : (
              <>
                <PlusCircle size={16} />
                Salvar lancamento
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
