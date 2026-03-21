import { useMemo, useState } from "react";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FileDropzone from "../../components/extratos/FileDropzone";
import SelectedFilesList from "../../components/extratos/SelectedFilesList";
import type { SelectedFile } from "../../types/file";
import { uploadExtractFiles } from "../../services/extratos.service";

function isExcelFile(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith(".xlsx") || name.endsWith(".xls");
}

function generateFileId(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export default function ImportarExtratosPage() {
  const navigate = useNavigate();

  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasFiles = useMemo(() => files.length > 0, [files]);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;

    const incomingFiles = Array.from(fileList).filter(isExcelFile);

    setFiles((current) => {
      const existingIds = new Set(current.map((item) => item.id));

      const newItems = incomingFiles
        .map((file) => ({
          id: generateFileId(file),
          file,
        }))
        .filter((item) => !existingIds.has(item.id));

      return [...current, ...newItems];
    });
  }

  function handleDragEnter() {
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  }

  function handleRemoveFile(id: string) {
    setFiles((current) => current.filter((item) => item.id !== id));
  }

  async function handleSubmit() {
    if (!files.length) return;

    try {
      setIsSubmitting(true);

      await uploadExtractFiles(files.map((item) => item.file));

      console.log("Arquivos enviados com sucesso");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => navigate("/extratos")}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-700"
          >
            <ArrowLeft size={16} />
            Voltar para extratos
          </button>

          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Importar extratos
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Adicione os arquivos Excel para iniciar a importação e preparação
            dos lançamentos.
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!hasFiles || isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload size={18} />
                Enviar arquivos
              </>
            )}
          </button>
        </div>
      </div>

      <FileDropzone
        isDragging={isDragging}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onSelectFiles={addFiles}
      />

      <SelectedFilesList files={files} onRemoveFile={handleRemoveFile} />
    </div>
  );
}
