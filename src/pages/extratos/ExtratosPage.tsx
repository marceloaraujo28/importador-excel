import { Upload, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ExtratosPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Extratos
          </h2>
          <p className="text-sm text-gray-500">
            Gerencie os lançamentos bancários
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            <Download size={16} />
            Exportar
          </button>

          <button
            onClick={() => navigate("/extratos/importar")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
          >
            <Upload size={16} />
            Importar
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <p className="text-gray-500 text-sm">Nenhum extrato carregado ainda.</p>
      </div>
    </div>
  );
}
