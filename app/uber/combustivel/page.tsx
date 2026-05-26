"use client";

import PageHeader from "@/components/PageHeader/PageHeader";
import { Fuel, Plus, TrendingDown } from "lucide-react";
import { useState } from "react";

export default function CombustivelUber() {
  const [combustivel, setCombustivel] = useState([
    { id: 1, data: "25/05/2026", litros: 45, valor: 220.50, preco: "R$ 4,90/L", km: 450, consumo: "10.2 km/L" },
    { id: 2, data: "22/05/2026", litros: 40, valor: 196.00, preco: "R$ 4,90/L", km: 400, consumo: "10.0 km/L" },
    { id: 3, data: "19/05/2026", litros: 50, valor: 245.00, preco: "R$ 4,90/L", km: 520, consumo: "10.4 km/L" },
    { id: 4, data: "16/05/2026", litros: 38, valor: 186.20, preco: "R$ 4,90/L", km: 380, consumo: "10.0 km/L" },
    { id: 5, data: "13/05/2026", litros: 42, valor: 205.80, preco: "R$ 4,90/L", km: 420, consumo: "10.0 km/L" },
  ]);

  const totalGastos = combustivel.reduce((acc, c) => acc + c.valor, 0);
  const totalLitros = combustivel.reduce((acc, c) => acc + c.litros, 0);
  const mediaLitrosPorAbastecimento = (totalLitros / combustivel.length).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Combustível" description="Controle de despesas com combustível" />
        <button className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-white hover:bg-orange-700">
          <Plus className="h-5 w-5" />
          Registrar Abastecimento
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-600">Total Gasto</h3>
            <TrendingDown className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">R$ {totalGastos.toFixed(2)}</p>
          <p className="mt-2 text-xs text-slate-500">Últimos 5 abastecimentos</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-600">Total de Litros</h3>
            <Fuel className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalLitros}L</p>
          <p className="mt-2 text-xs text-slate-500">Últimos 5 abastecimentos</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-600">Média por Abastecimento</h3>
            <Fuel className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{mediaLitrosPorAbastecimento}L</p>
          <p className="mt-2 text-xs text-slate-500">Últimos 5 abastecimentos</p>
        </div>
      </div>

      {/* Tabela de Combustível */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Histórico de Abastecimentos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Data</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Litros</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Preço Unitário</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">KM Rodado</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Consumo</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-slate-600">Valor Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {combustivel.map((abast) => (
                <tr key={abast.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-900">{abast.data}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{abast.litros}L</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{abast.preco}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{abast.km} km</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{abast.consumo}</td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-orange-600">
                    R$ {abast.valor.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Insights</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-sm text-slate-600">Preço Médio do Litro</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">R$ 4,90</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-sm text-slate-600">Consumo Médio</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">10,1 km/L</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
