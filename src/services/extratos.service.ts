export async function uploadExtractFiles(files: File[]) {
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
