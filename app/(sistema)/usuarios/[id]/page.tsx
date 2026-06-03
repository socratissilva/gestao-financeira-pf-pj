'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Usuario {
  _id: string;
  nome: string;
  email: string;
  role: 'ADMIN' | 'PADRAO';
  isAtivo: boolean;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  PADRAO: 'Padrão',
};

export default function DetalhesUsuarioPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const id = params.id as string;

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInativarModal, setShowInativarModal] = useState(false);
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
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const fetchUsuario = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/usuarios/${id}`);
      if (!response.ok) throw new Error('Erro ao buscar usuário');
      const data = await response.json();
      setUsuario(data.usuario);
      setFormData({
        nome: data.usuario.nome,
        email: data.usuario.email,
        role: data.usuario.role,
        password: '',
        confirmarSenha: '',
      });
    } catch (err) {
      exibirFeedback(err instanceof Error ? err.message : 'Erro ao buscar usuário', 'erro');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchUsuario(); }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmarSenha) {
      exibirFeedback('As senhas não coincidem.', 'erro');
      return;
    }

    if (formData.password && formData.password.length < 8) {
      exibirFeedback('Senha deve ter no mínimo 8 caracteres.', 'erro');
      return;
    }

    setIsSubmitting(true);
    try {
      const body: Record<string, string> = {
        nome: formData.nome,
        email: formData.email,
        role: formData.role,
      };
      if (formData.password) body.password = formData.password;

      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao atualizar usuário');
      }

      const data = await response.json();
      setUsuario(data.usuario);
      setIsEditing(false);
      setFormData((prev) => ({ ...prev, password: '', confirmarSenha: '' }));
      exibirFeedback('Usuário atualizado com sucesso!', 'sucesso');
    } catch (err) {
      exibirFeedback(err instanceof Error ? err.message : 'Erro ao atualizar usuário', 'erro');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInativar = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao inativar usuário');
      }
      exibirFeedback('Usuário inativado com sucesso!', 'sucesso');
      setTimeout(() => router.push('/usuarios'), 1500);
    } catch (err) {
      exibirFeedback(err instanceof Error ? err.message : 'Erro ao inativar usuário', 'erro');
      setShowInativarModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReativar = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAtivo: true }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao reativar usuário');
      }
      const data = await response.json();
      setUsuario(data.usuario);
      exibirFeedback('Usuário reativado com sucesso!', 'sucesso');
    } catch (err) {
      exibirFeedback(err instanceof Error ? err.message : 'Erro ao reativar usuário', 'erro');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = session?.user?.role === 'ADMIN';
  const isSelf = session?.user?.id === id;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-500 font-medium">
        Carregando usuário...
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-red-700 font-medium">Usuário não encontrado.</p>
        <button
          onClick={() => router.push('/usuarios')}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Voltar
        </button>
      </div>
    );
  }

  const inputClassName = `px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors w-full ${
    isEditing
      ? 'bg-white border-slate-300 text-slate-900'
      : 'bg-slate-50 border-transparent text-slate-700 disabled:appearance-none cursor-default'
  }`;

  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto relative">

      {/* Toast de feedback */}
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

      {/* Modal de confirmação de inativação */}
      {showInativarModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center gap-4 mb-4 text-red-600">
              <div className="bg-red-100 p-3 rounded-full">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800">Inativar Usuário?</h2>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Você está prestes a inativar o usuário <span className="font-semibold text-slate-800">"{usuario.nome}"</span>. Ele perderá o acesso ao sistema. Você poderá reativá-lo depois.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowInativarModal(false)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleInativar}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center gap-2"
              >
                {isSubmitting ? 'Inativando...' : 'Inativar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex justify-between items-center mt-2">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          {isEditing ? `Editando: ${usuario.nome}` : usuario.nome}
          <span className={`px-2.5 py-1 text-xs font-bold rounded-md border uppercase tracking-wider ${
            usuario.isAtivo
              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
              : 'bg-red-100 text-red-700 border-red-200'
          }`}>
            {usuario.isAtivo ? 'Ativo' : 'Inativo'}
          </span>
        </h1>
        <button
          type="button"
          onClick={() => router.push('/usuarios')}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-sm"
        >
          <span>←</span> Voltar
        </button>
      </div>

      {/* Card principal */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Seção Dados de Acesso */}
          <div className="flex flex-col gap-3">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-1">
              Dados de Acesso
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1 lg:col-span-2">
                <label htmlFor="nome" className="text-xs font-medium text-slate-600">Nome</label>
                <input
                  id="nome" type="text" name="nome" required
                  disabled={!isEditing}
                  value={formData.nome} onChange={handleChange}
                  className={inputClassName}
                />
              </div>

              <div className="flex flex-col gap-1 lg:col-span-2">
                <label htmlFor="email" className="text-xs font-medium text-slate-600">E-mail</label>
                <input
                  id="email" type="email" name="email" required
                  disabled={!isEditing}
                  value={formData.email} onChange={handleChange}
                  className={inputClassName}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="role" className="text-xs font-medium text-slate-600">Perfil</label>
                {isEditing ? (
                  <select
                    id="role" name="role" required
                    value={formData.role} onChange={handleChange}
                    className={inputClassName}
                  >
                    <option value="PADRAO">Padrão</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                ) : (
                  <input
                    disabled
                    value={roleLabels[usuario.role] ?? usuario.role}
                    className={inputClassName}
                    readOnly
                  />
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Membro desde</label>
                <input
                  disabled
                  value={new Date(usuario.createdAt).toLocaleDateString('pt-BR')}
                  className={`px-3 py-2 text-sm rounded-lg border-transparent bg-slate-50 text-slate-700 disabled:appearance-none cursor-default w-full`}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Seção Alterar Senha (apenas no modo de edição) */}
          {isEditing && (
            <div className="flex flex-col gap-3">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-1">
                Alterar Senha
                <span className="ml-2 text-xs font-normal text-slate-400">(deixe em branco para manter a atual)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="password" className="text-xs font-medium text-slate-600">Nova Senha</label>
                  <input
                    id="password" type="password" name="password"
                    value={formData.password} onChange={handleChange}
                    placeholder="Mínimo 8 caracteres"
                    className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors w-full"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="confirmarSenha" className="text-xs font-medium text-slate-600">Confirmar Nova Senha</label>
                  <input
                    id="confirmarSenha" type="password" name="confirmarSenha"
                    value={formData.confirmarSenha} onChange={handleChange}
                    placeholder="Repita a nova senha"
                    className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Rodapé de ações */}
          <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-4">
            {/* Esquerda: Inativar / Reativar */}
            <div>
              {isAdmin && !isSelf && usuario.isAtivo && (
                <button
                  type="button"
                  onClick={() => setShowInativarModal(true)}
                  className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  Inativar
                </button>
              )}
              {isAdmin && !isSelf && !usuario.isAtivo && (
                <button
                  type="button"
                  onClick={handleReativar}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Reativar
                </button>
              )}
            </div>

            {/* Direita: Editar / Cancelar + Salvar */}
            <div className="flex gap-3">
              {isAdmin && !isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  disabled={!usuario.isAtivo}
                  title={!usuario.isAtivo ? 'Reative o usuário para editar' : ''}
                  className={`px-5 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors flex items-center gap-2 ${
                    usuario.isAtivo ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed opacity-70'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Editar
                </button>
              )}

              {isEditing && (
                <>
                  <button
                    type="button"
                    onClick={() => { setIsEditing(false); fetchUsuario(); }}
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    )}
                    {isSubmitting ? 'Salvando...' : 'Salvar'}
                  </button>
                </>
              )}
            </div>
          </div>

        </form>
      </div>

    </div>
  );
}
