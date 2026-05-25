

interface InputFieldProps {
  label: string;
  name?: string;
  placeholder?: string;
  type?: "text" | "date" | "number" | "currency";
  isMultiline?: boolean;
  required?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  
}

export function InputField({ label, name, placeholder, type = "text", isMultiline = false, required = false, onBlur,  }: InputFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${isMultiline ? 'md:col-span-2' : ''}`}>
      <label className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1" title="Campo obrigatório">*</span>}
        </label>
      
      {isMultiline ? (
        <textarea 
          name={name}
          placeholder={placeholder}
          rows={4}
          required={required}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none bg-white"
        />
      ) : (
        <div className="relative">
          {/* Prefixo de moeda R$ aparece apenas se o tipo for currency */}
          {type === "currency" && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
              R$
            </span>
          )}
          
          <input 
            name={name}
            type={type === "currency" ? "number" : type}
            placeholder={placeholder}
            required={required}
            className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white
              ${type === "currency" ? 'pl-9' : ''}
            `}
            onBlur={onBlur}
            
          />
        </div>
      )}
    </div>
  );
}