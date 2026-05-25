import Button from "@/components/Button/Button"; 
import React from "react";


interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}


export function FormSection({ title, children }: FormSectionProps) {
  return (
   <div className="border-t first:border-t-0 border-slate-100 pt-8 first:pt-0">
      <h2 className="text-xl font-semibold text-slate-800 mb-6">{title}</h2>     
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </div>
  );
}


interface FormContainerProps {  
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  loading?: boolean;
  submitLabel?: string;
  children: React.ReactNode;
  onChange?: () => void;
  onInput?: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function FormContainer({ 
  onSubmit, 
  onCancel, 
  loading, 
  submitLabel, 
  children,
  onChange,
  onInput }: FormContainerProps) {

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());   

    onSubmit(data); // 
  };

 
  // impedir fechamento acidental por enter
  const impedirEnter = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // Se pressionar Enter e NÃO for um campo de texto longo (textarea)
    if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
      e.preventDefault(); // Cancela o envio do formulário
    }
  };

  // confirmar cancelamento se houver dados preenchidos
  const confirmarSaida = () => {
    if (onCancel) {
      const confirmou = window.confirm(
        "Você tem alterações não salvas. Deseja realmente sair e descartar o formulário?"
      );
      if (confirmou) {
        onCancel();
      }
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      onKeyDown={impedirEnter}
      onInput={onInput}
      onChange={onChange}
      className="bg-white rounded-xl shadow-md overflow-hidden"
    >
      
      {/* Conteúdo do Formulário */}
      <div className="p-8 space-y-10">
        {children}
      </div>      


      {/* Rodapé */}

      <div className="px-8 py-6 bg-slate-50 border-t flex justify-end gap-3">
        {onCancel && (
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onCancel} 
          >
            Cancelar
          </Button>
        )}
        
        <Button 
          type="submit" 
          variant="primary" 
          disabled={loading}
        >
          {loading ? "Salvando..." : submitLabel}
        </Button>
      </div>
        
      
    </form>



  
  );
}