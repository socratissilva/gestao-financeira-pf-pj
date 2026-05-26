"use client";

import PageHeader from "@/components/PageHeader/PageHeader";
import { Wrench, Plus, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function ManutencaoUber() {
  const [manutencoes, setManutencoes] = useState([
    { id: 1, data: "20/05/2026", tipo: "Troca de Óleo", valor: 150.00, km: 45000, proxima: "48000 km", status: "Concluída" },
    { id: 2, data: "15/05/2026", tipo: "Revisão Geral", valor: 250.00, km: 44500, proxima: "50000 km", status: "Concluída" },
    { id: 3, data: "08/05/2026", tipo: "Balanceamento", valor: 80.00, km: 44000, proxima: "50000 km", status: "Concluída" },
    { id: 4, data: "01/05/2026", tipo: "Alinhamento", valor: 120.00, km: 43500, proxima: "50000 km", status: "Concluída" },
    { id: 5, data: "25/04/2026", tipo: "Troca de Pneu", valor: 450.00, km: 43000, proxima: "Sem data", status: "Concluída" },
  ]);

  const proximas = [
    { tipo: "Troca de Óleo", km: 48000, status: "warning" },
    { tipo: "Revisão Geral", km: 50000, status: "info" },
  ];

  const totalGasto = manutencoes.reduce((acc, m) => acc + m.valor, 0);
  const totalManutencoes = manutencoes.length;
  const mediaManutencao = (totalGasto / totalManutencoes).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Manutenção" description="Controle de despesas com manutenção do veículo" />
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          <Plus className="h-5 w-5" />
          Registrar Manutenção
        </button>
      </div>

      {/* Alertas de Próximas Manutenções */}
      {proximas.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-900">Próximas Manutenções Programadas</h3>
              <ul className="mt-2 space-y-1">
                {proximas.map((manut, idx) => (
                  <li key={idx} className="text-sm text-yellow-800">
                    • {manut.tipo} - {manut.km} km
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-600">Total Gasto</h3>
            <Wrench className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">R$ {totalGasto.toFixed(2)}</p>
          <p className="mt-2 text-xs text-slate-500">Últimas 5 manutenções</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-600">Total de Serviços</h3>
            <Wrench className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalManutencoes}</p>
          <p className="mt-2 text-xs text-slate-500">Últimas 5 manutenções</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-600">Média por Serviço</h3>
            <Wrench className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">R$ {mediaManutencao}</p>
          <p className="mt-2 text-xs text-slate-500">Últimas 5 manutenções</p>
        </div>
      </div>

      {/* Tabela de Manutenção */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Histórico de Manutenções</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Data</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Tipo de Serviço</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">KM</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Próxima Manutenção</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-slate-600">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {manutencoes.map((manut) => (
                <tr key={manut.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-900">{manut.data}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{manut.tipo}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{manut.km} km</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{manut.proxima}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                      {manut.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-red-600">
                    R$ {manut.valor.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recomendações */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-3 font-semibold text-blue-900">Recomendações de Manutenção</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Mantenha registro de todas as manutenções realizadas</li>
          <li>• Faça revisão geral a cada 10.000 km ou conforme manual do veículo</li>
          <li>• Verifique pneus mensalmente para garantir segurança e economia de combustível</li>
          <li>• Troque óleo e filtro regularmente para prolongar vida útil do motor</li>
        </ul>
      </div>
    </div>
  );
}
