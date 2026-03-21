import { useRef } from "react";
import { UploadCloud, FileSpreadsheet } from "lucide-react";
import clsx from "clsx";

type FileDropzoneProps = {
  isDragging: boolean;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onSelectFiles: (files: FileList | null) => void;
};

export default function FileDropzone({
  isDragging,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onSelectFiles,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={clsx(
        "relative rounded-2xl border-2 border-dashed p-8 sm:p-10 transition-all",
        isDragging
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/40",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        multiple
        className="hidden"
        onChange={(event) => onSelectFiles(event.target.files)}
      />

      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
          <UploadCloud size={28} />
        </div>

        <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
          Arraste os arquivos Excel aqui
        </h3>

        <p className="mt-2 max-w-xl text-sm text-gray-500">
          Você pode importar vários extratos de uma vez. Os arquivos devem estar
          no formato Excel e preferencialmente já renomeados com o ID da conta.
        </p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          <FileSpreadsheet size={18} />
          Selecionar arquivos
        </button>

        <span className="mt-3 text-xs text-gray-400">
          Formato aceito: .xlsx, .xls
        </span>
      </div>
    </div>
  );
}
