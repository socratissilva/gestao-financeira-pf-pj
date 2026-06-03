'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function NovoUsuarioPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    role: 'PADRAO',
    password: '',
    confirmarSenha: '',
  });

  const exibirFeedback = (texto: string, tipo: 'sucesso' | 'erro') => {
    setFeedbackMsg({ texto, tipo });
    if (tipo === 'erro') setTimeout(() => setFeedbackMsg(null), 4000);
  };

  if (session && session.user?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-red-700 font-medium">Acesso negado. Apenas administradores podem criar usuários.</p>
        <button
          onClick={() => router.push('/usuarios')}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Voltar
        </button>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmarSenha) {
      exibirFeedback('As senhas não coincidem.', 'erro');
      return;
    }

    if (formData.password.length < 8) {
      exibirFeedback('Senha deve ter no mínimo 8 caracteres.', 'erro');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao criar usuário');
      }

      exibirFeedback('Usuário criado com sucesso!', 'sucesso');
      setTimeout(() => router.push('/usuarios'), 1500);
    } catch (err) {
      exibirFeedback(err instanceof Error ? err.message : 'Erro ao criar usuário', 'erro');
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    'px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors w-full';

  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto relative">

      {feedbackMsg && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-xl shadow-2xl text-base font-bold flex items-center gap-3 border-2 ${
          feedbackMsg.tipo === 'sucesso'
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
            : 'bg-red-100 text-red-800 border-red-300'
        }`}>
          {feedbackMsg.tipo === 'sucesso' ? (
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}
          {feedbackMsg.texto}
        </div>
      )}

      <div className="flex justify-between items-center mt-2">
        <h1 className="text-2xl font-bold text-slate-800">Novo Usuário</h1>
        <button
          type="button"
          onClick={() => router.push('/usuarios')}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-sm"
        >
          <span>←</span> Voltar
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <div className="flex flex-col gap-3">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-1">
              Dados de Acesso
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="nome" className="text-xs font-medium text-slate-600">Nome *</label>
                <input
                  id="nome" type="text" name="nome" required
                  value={formData.nome} onChange={handleChange}
                  placeholder="Ex: João Silva"
                  className={inputClassName}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-xs font-medium text-slate-600">E-mail *</label>
                <input
                  id="email" type="email" name="email" required
                  value={formData.email} onChange={handleChange}
                  placeholder="Ex: joao@empresa.com"
                  className={inputClassName}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="role" className="text-xs font-medium text-slate-600">Perfil *</label>
                <select
                  id="role" name="role" required
                  value={formData.role} onChange={handleChange}
                  className={inputClassName}
                >
                  <option value="PADRAO">Padrão</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-1">
              Segurança
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="password" className="text-xs font-medium text-slate-600">Senha *</label>
                <input
                  id="password" type="password" name="password" required
                  value={formData.password} onChange={handleChange}
                  placeholder="Mínimo 8 caracteres"
                  className={inputClassName}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="confirmarSenha" className="text-xs font-medium text-slate-600">Confirmar Senha *</label>
                <input
                  id="confirmarSenha" type="password" name="confirmarSenha" required
                  value={formData.confirmarSenha} onChange={handleChange}
                  placeholder="Repita a senha"
                  className={inputClassName}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center mt-2 border-t border-slate-100 pt-4 gap-3">
            <button
              type="button"
              onClick={() => router.push('/usuarios')}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              {isSubmitting && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {isSubmitting ? 'Criando...' : 'Criar Usuário'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
