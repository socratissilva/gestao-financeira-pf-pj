'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import PageHeader from '@/components/PageHeader/PageHeader';
import { SearchBar } from '@/components/SearchBar';
import { FilterBar } from '@/components/FilterBar';

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

const roleColors: Record<string, { bg: string; color: string }> = {
  ADMIN: { bg: '#ede9fe', color: '#5b21b6' },
  PADRAO: { bg: '#e0f2fe', color: '#0369a1' },
};

export default function UsuariosPage() {
  const { data: session } = useSession();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busca, setBusca] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  const opcoesStatus = [
    { label: 'Todos', value: 'todos' },
    { label: 'Ativo', value: 'ativo' },
    { label: 'Inativo', value: 'inativo' },
  ];

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/usuarios');

        if (!response.ok) {
          throw new Error('Erro ao buscar usuários');
        }

        const data = await response.json();
        setUsuarios(data.usuarios || []);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar usuários');
        setUsuarios([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  const getInitials = (nome: string) => {
    if (!nome) return '?';
    return nome
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (nome: string) => {
    const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4'];
    if (!nome) return colors[0];
    return colors[nome.charCodeAt(0) % colors.length];
  };

  const canCreate = session?.user?.role === 'ADMIN';

  const usuariosFiltrados = usuarios.filter((u) => {
    const termo = busca.toLowerCase().trim();
    const matchBusca = !termo || u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo);
    const matchStatus =
      statusFilter === 'todos' ||
      (statusFilter === 'ativo' && u.isAtivo) ||
      (statusFilter === 'inativo' && !u.isAtivo);
    return matchBusca && matchStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usuários"
        buttonLabel={canCreate ? 'Novo Usuário' : undefined}
        buttonHref={canCreate ? '/usuarios/novo' : undefined}
      />

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <SearchBar
          placeholder="Pesquisar usuários..."
          onSearch={(val) => setBusca(val)}
        />
        <FilterBar
          options={opcoesStatus}
          currentValue={statusFilter}
          onChange={(val) => setStatusFilter(val)}
        />
      </div>

      <div
        style={{
          padding: '2rem',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          minHeight: '60vh',
        }}
      >
        {error && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '1rem',
              borderRadius: '6px',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            Carregando usuários...
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            <p style={{ marginBottom: '1rem' }}>Nenhum usuário encontrado.</p>
            {canCreate && usuarios.length === 0 && (
              <Link href="/usuarios/novo">
                <button
                  style={{
                    backgroundColor: '#007BFF',
                    color: '#fff',
                    border: 'none',
                    padding: '0.625rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  + Criar primeiro Usuário
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {usuariosFiltrados.map((usuario) => (
              <Link key={usuario._id} href={`/usuarios/${usuario._id}`}>
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                    el.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.boxShadow = 'none';
                    el.style.transform = 'translateY(0)';
                  }}
                >
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: getAvatarColor(usuario.nome),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      margin: '0 auto 1rem',
                    }}
                  >
                    {getInitials(usuario.nome)}
                  </div>

                  <p
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#1e293b',
                      margin: '0 0 0.25rem',
                    }}
                  >
                    {usuario.nome}
                  </p>

                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      margin: '0 0 0.75rem',
                      wordBreak: 'break-all',
                    }}
                  >
                    {usuario.email}
                  </p>

                  <div
                    style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: roleColors[usuario.role]?.bg ?? '#f3f4f6',
                      color: roleColors[usuario.role]?.color ?? '#374151',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {roleLabels[usuario.role] ?? usuario.role}
                  </div>

                  <div>
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: usuario.isAtivo ? '#dcfce7' : '#fee2e2',
                        color: usuario.isAtivo ? '#166534' : '#991b1b',
                      }}
                    >
                      {usuario.isAtivo ? 'Ativo' : 'Inativo'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
