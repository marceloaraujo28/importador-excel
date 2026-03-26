import type {
  ConfirmExtractReviewPayload,
  ConfirmExtractReviewResponse,
  ListExtratosParams,
  ListExtratosResponse,
  UpdateExtratosPayload,
  UpdateExtratosResponse,
  UploadExtractFilesResponse,
} from "../types/extrato";

const BASE_URL = "http://localhost:3333";

export async function uploadExtractFiles(
  files: File[],
): Promise<UploadExtractFilesResponse> {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await fetch(`${BASE_URL}/extratos/importar`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Erro ao enviar arquivos");
  }

  return response.json();
}

export async function confirmExtractReview(
  payload: ConfirmExtractReviewPayload,
): Promise<ConfirmExtractReviewResponse> {
  const response = await fetch(`${BASE_URL}/extratos/revisao/confirmar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Erro ao salvar revisão dos extratos");
  }

  return response.json();
}

export async function listExtratos(
  params: ListExtratosParams = {},
): Promise<ListExtratosResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set("page", String(params.page));
  }

  if (params.pageSize) {
    searchParams.set("pageSize", String(params.pageSize));
  }

  if (params.assignment) {
    searchParams.set("assignment", params.assignment);
  }

  if (params.dateFrom) {
    searchParams.set("dateFrom", params.dateFrom);
  }

  if (params.dateTo) {
    searchParams.set("dateTo", params.dateTo);
  }

  if (params.dateOrder) {
    searchParams.set("dateOrder", params.dateOrder);
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `${BASE_URL}/extratos?${queryString}`
    : `${BASE_URL}/extratos`;

  const response = await fetch(url);

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Erro ao buscar extratos");
  }

  return response.json();
}

export async function updateExtratos(
  payload: UpdateExtratosPayload,
): Promise<UpdateExtratosResponse> {
  const response = await fetch(`${BASE_URL}/extratos`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Erro ao atualizar extratos");
  }

  return response.json();
}
