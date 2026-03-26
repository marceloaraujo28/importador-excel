import { NavLink } from "react-router-dom";
import { LayoutDashboard, FileText, X } from "lucide-react";
import clsx from "clsx";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <div
        onClick={onClose}
        className={clsx(
          "fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={clsx(
          "fixed left-0 top-0 z-50 h-screen w-64 bg-[#0f172a] text-white flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:static lg:translate-x-0",
        )}
      >
        <div className="h-16 flex items-center justify-between px-6 text-lg font-semibold border-b border-white/10">
          <div className="bg-white flex justify-between items-center rounded-2xl p-1 gap-1 opacity-80">
            <img src="/grupo_vale.png" alt="Logo" className="h-8 w-8" />
            <span className="text-sm text-center text-gray-800">
              Grupo Vale do Verdão & Cambuí
            </span>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden text-gray-300 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          <NavLink
            to="/"
            end
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition",
                isActive ? "bg-blue-600" : "text-gray-300 hover:bg-white/10",
              )
            }
          >
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>

          <NavLink
            to="/extratos"
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition",
                isActive ? "bg-blue-600" : "text-gray-300 hover:bg-white/10",
              )
            }
          >
            <FileText size={18} />
            Extratos
          </NavLink>
          <NavLink
            to="/saldos-iniciais"
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition",
                isActive ? "bg-blue-600" : "text-gray-300 hover:bg-white/10",
              )
            }
          >
            <FileText size={18} />
            Saldos Iniciais
          </NavLink>
        </nav>
      </aside>
    </>
  );
}
