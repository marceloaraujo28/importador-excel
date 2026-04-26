import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type CheckboxMultiSelectOption = {
  value: string;
  label: string;
  description?: string;
};

type CheckboxMultiSelectProps = {
  label: string;
  emptyLabel: string;
  selectedValues: string[];
  options: CheckboxMultiSelectOption[];
  onChange: (value: string[]) => void;
  allSelectedLabel?: string;
  widthClassName?: string;
};

function buildButtonLabel(
  selectedValues: string[],
  options: CheckboxMultiSelectOption[],
  emptyLabel: string,
  allSelectedLabel?: string,
) {
  if (!selectedValues.length) {
    return emptyLabel;
  }

  if (selectedValues.length === options.length && allSelectedLabel) {
    return allSelectedLabel;
  }

  if (selectedValues.length === 1) {
    return (
      options.find((option) => option.value === selectedValues[0])?.label ??
      selectedValues[0] ??
      emptyLabel
    );
  }

  return `${selectedValues.length} selecionados`;
}

export default function CheckboxMultiSelect({
  label,
  emptyLabel,
  selectedValues,
  options,
  onChange,
  allSelectedLabel,
  widthClassName = "w-88",
}: CheckboxMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const sortedOptions = useMemo(
    () => [...options].sort((a, b) => a.label.localeCompare(b.label)),
    [options],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target;

      if (
        target instanceof Node &&
        containerRef.current &&
        !containerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleToggleValue(value: string) {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((item) => item !== value));
      return;
    }

    onChange(
      [...selectedValues, value].sort((a, b) => {
        const left =
          sortedOptions.find((option) => option.value === a)?.label ?? a;
        const right =
          sortedOptions.find((option) => option.value === b)?.label ?? b;
        return left.localeCompare(right);
      }),
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-sm text-gray-700 outline-none transition hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <span className="truncate">
          {buildButtonLabel(
            selectedValues,
            sortedOptions,
            emptyLabel,
            allSelectedLabel,
          )}
        </span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {open && (
        <div
          className={`absolute z-20 mt-2 ${widthClassName} max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white p-3 shadow-lg`}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onChange(sortedOptions.map((option) => option.value))}
              className="text-xs font-medium text-blue-600 transition hover:text-blue-700"
            >
              Selecionar todos
            </button>

            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs font-medium text-gray-500 transition hover:text-gray-700"
            >
              Limpar
            </button>
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {sortedOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => handleToggleValue(option.value)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />

                <span className="min-w-0">
                  <span className="block font-medium text-gray-900">
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="block truncate text-xs text-gray-500">
                      {option.description}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
