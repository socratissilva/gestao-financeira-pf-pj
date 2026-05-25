

interface FilterOption {
  label: string; 
  value: string;
}

interface FilterBarProps {
  options: FilterOption[];   
  currentValue: string;       
  onChange: (value: string) => void; 
}

export function FilterBar({ options, currentValue, onChange }: FilterBarProps) {
  return (
    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
            currentValue === option.value
              ? "bg-white text-slate-900 shadow-sm" // Estilo do botão selecionado
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50" // Estilo dos outros
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}