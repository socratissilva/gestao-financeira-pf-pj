"use client";

import PageHeader from "@/components/PageHeader/PageHeader";
import { Home, TrendingUp, Wallet, Users } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral do sistema"
      />

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-white rounded-xl p-4 shadow border">
          <div className="flex items-center gap-2 text-slate-600">
            <Home size={18} />
            <span>Resumo Geral</span>
          </div>
          <p className="text-2xl font-bold mt-2">Sistema OK</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow border">
          <div className="flex items-center gap-2 text-slate-600">
            <TrendingUp size={18} />
            <span>Receitas</span>
          </div>
          <p className="text-2xl font-bold mt-2">R$ 0,00</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow border">
          <div className="flex items-center gap-2 text-slate-600">
            <Wallet size={18} />
            <span>Despesas</span>
          </div>
          <p className="text-2xl font-bold mt-2">R$ 0,00</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow border">
          <div className="flex items-center gap-2 text-slate-600">
            <Users size={18} />
            <span>Usuários</span>
          </div>
          <p className="text-2xl font-bold mt-2">1</p>
        </div>

      </div>

      {/* Área inferior */}
      <div className="bg-white rounded-xl p-6 shadow border">
        <h2 className="text-lg font-semibold mb-2">
          Bem-vindo ao sistema
        </h2>

        <p className="text-slate-600">
          Este é o dashboard inicial com Sidebar ativo.
          Você pode navegar pelas seções do sistema usando o menu lateral.
        </p>
      </div>

    </div>
  );
}