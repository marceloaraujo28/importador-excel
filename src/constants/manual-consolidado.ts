import type {
  ManualConsolidadoAssignment,
  ManualConsolidadoStatus,
  ManualConsolidadoStatusFilter,
  ManualConsolidadoTransferDirection,
} from "../types/manual-consolidado";

export const MANUAL_CONSOLIDADO_ASSIGNMENT_OPTIONS: Array<{
  value: ManualConsolidadoAssignment;
  label: string;
}> = [
  { value: "ENTRADAS", label: "Entrada" },
  { value: "SAIDAS", label: "Saida" },
  { value: "RESGATES", label: "Resgates" },
  { value: "APLICACOES", label: "Aplicacoes" },
  { value: "TRANSFERENCIA_EC", label: "Transferencia entre contas" },
];

export const MANUAL_CONSOLIDADO_STATUS_OPTIONS: Array<{
  value: ManualConsolidadoStatus;
  label: string;
}> = [
  { value: "AUTORIZADO", label: "Autorizado" },
  { value: "NAO_AUTORIZADO", label: "Nao autorizado" },
];

export const MANUAL_CONSOLIDADO_STATUS_FILTER_OPTIONS: Array<{
  value: ManualConsolidadoStatusFilter;
  label: string;
}> = [
  { value: "TODOS", label: "Todos" },
  { value: "AUTORIZADO", label: "Autorizados" },
  { value: "NAO_AUTORIZADO", label: "Nao autorizados" },
];

export const MANUAL_CONSOLIDADO_TRANSFER_DIRECTION_OPTIONS: Array<{
  value: ManualConsolidadoTransferDirection;
  label: string;
}> = [
  { value: "ENTRADA", label: "Entrada" },
  { value: "SAIDA", label: "Saida" },
];

export function getManualConsolidadoAssignmentLabel(
  assignment: ManualConsolidadoAssignment,
) {
  return (
    MANUAL_CONSOLIDADO_ASSIGNMENT_OPTIONS.find(
      (option) => option.value === assignment,
    )?.label ?? assignment
  );
}

export function getManualConsolidadoStatusLabel(
  status: ManualConsolidadoStatus,
) {
  return (
    MANUAL_CONSOLIDADO_STATUS_OPTIONS.find((option) => option.value === status)
      ?.label ?? status
  );
}

export function getManualConsolidadoTransferDirectionLabel(
  direction: ManualConsolidadoTransferDirection | null,
) {
  if (!direction) {
    return "-";
  }

  return (
    MANUAL_CONSOLIDADO_TRANSFER_DIRECTION_OPTIONS.find(
      (option) => option.value === direction,
    )?.label ?? direction
  );
}

export function getManualConsolidadoAssignmentClasses(
  assignment: ManualConsolidadoAssignment,
) {
  switch (assignment) {
    case "ENTRADAS":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "SAIDAS":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "RESGATES":
      return "border-purple-200 bg-purple-50 text-purple-700";
    case "APLICACOES":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "TRANSFERENCIA_EC":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

export function getManualConsolidadoStatusClasses(
  status: ManualConsolidadoStatus,
) {
  if (status === "AUTORIZADO") {
    return "border-emerald-200 bg-emerald-100 text-emerald-800";
  }

  return "border-rose-200 bg-rose-100 text-rose-800";
}
