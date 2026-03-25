import type {
  ConfirmExtractReviewPayload,
  ConfirmExtractReviewResponse,
  ListExtratosResponse,
  UploadExtractFilesResponse,
} from "../types/extrato";

export async function uploadExtractFiles(
  files: File[],
): Promise<UploadExtractFilesResponse> {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await fetch("http://localhost:3333/extratos/importar", {
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
  const response = await fetch(
    "http://localhost:3333/extratos/revisao/confirmar",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error("Erro ao salvar revisão dos extratos");
  }

  return response.json();
}

export async function listExtratos(): Promise<ListExtratosResponse> {
  const response = await fetch("http://localhost:3333/extratos");

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Erro ao buscar extratos");
  }

  return response.json();
}
