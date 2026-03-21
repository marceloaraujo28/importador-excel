import { FileSpreadsheet, Trash2 } from "lucide-react";
import type { SelectedFile } from "../../types/file";

type SelectedFilesListProps = {
  files: SelectedFile[];
  onRemoveFile: (id: string) => void;
};

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SelectedFilesList({
  files,
  onRemoveFile,
}: SelectedFilesListProps) {
  if (!files.length) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-800">
            Arquivos selecionados
          </h3>
          <p className="text-sm text-gray-500">
            {files.length} arquivo(s) pronto(s) para envio
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {files.map(({ id, file }) => (
          <div
            key={id}
            className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <FileSpreadsheet size={18} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onRemoveFile(id)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 sm:w-auto"
            >
              <Trash2 size={16} />
              Remover
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
