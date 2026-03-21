import { Menu } from "lucide-react";

type HeaderProps = {
  onOpenSidebar: () => void;
};

export default function Header({ onOpenSidebar }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden text-gray-600 hover:text-gray-900"
        >
          <Menu size={22} />
        </button>

        <h1 className="text-base sm:text-lg font-semibold text-gray-800 truncate"></h1>
      </div>

      <div className="hidden sm:block text-sm text-gray-500">
        Sistema Financeiro
      </div>
    </header>
  );
}
