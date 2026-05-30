"use client";


import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader/PageHeader";
import { Edit, Fuel, Plus, TrendingDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDateBR } from "@/utils/formatDate";
import toast from "react-hot-toast";

interface Abastecimento {
  _id: string;
  data: string;
  litros: number;
  valor: number;
  km: number;
  preco: number;
  consumo: number;
}

export default function CombustivelUber() {
  const [combustivel, setCombustivel] =
    useState<Abastecimento[]>([]);

  const [filterType, setFilterType] = useState<"day" | "month" | "year">("month");
  const [selectedMonth, setSelectedMonth] = useState("05-2026");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [startDate, setStartDate] = useState("2026-05-01");
  const [endDate, setEndDate] = useState("2026-05-31");

  const [loading, setLoading] = useState(true);

  /* =========================================================
     CARREGAR DADOS DO BANCO
  ========================================================= */

  useEffect(() => {
    fetchAbastecimentos();
  }, []);

  async function fetchAbastecimentos() {
    try {
      setLoading(true);
      const response = await fetch("/api/uber/combustivel");
      const data = await response.json();

      if (data.success) {
        setCombustivel(data.abastecimentos || []);
      }
    } catch (error) {
      console.error("Erro ao buscar abastecimentos:", error);
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     FILTROS
  ========================================================= */
  const router = useRouter();

  const combustivelFiltrado = combustivel.filter((item) => {
    const data = new Date(item.data);

    if (filterType === "month") {
      const [mes, ano] = selectedMonth.split("-");
      return (
        data.getUTCMonth() + 1 === Number(mes) &&
        data.getUTCFullYear() === Number(ano)
      );
    }

    if (filterType === "year") {
      return data.getUTCFullYear() === Number(selectedYear);
    }

    if (filterType === "day") {
      const inicio = new Date(startDate);
      const fim = new Date(endDate);
      inicio.setHours(0, 0, 0, 0);
      fim.setHours(23, 59, 59, 999);
      return data >= inicio && data <= fim;
    }

    return true;
  });

  const totalGastos = combustivelFiltrado.reduce((acc, c) => acc + c.valor, 0);
  const totalLitros = combustivelFiltrado.reduce((acc, c) => acc + c.litros, 0);
  const totalKmRodados = combustivelFiltrado.reduce(
    (acc, c) => acc + Number(c.km || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Combustível" description="Controle de despesas com combustível" />
        <button
          onClick={() => router.push("/uber/combustivel/novo")}
          className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 transition"
        >
          <Plus className="h-5 w-5" />
          Registrar Abastecimento
        </button>
      </div>

      
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="filterType"
                value="month"
                checked={filterType === "month"}
                onChange={() => setFilterType("month")}
                className="h-4 w-4 cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-700">Por Mês</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="filterType"
                value="year"
                checked={filterType === "year"}
                onChange={() => setFilterType("year")}
                className="h-4 w-4 cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-700">Por Ano</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="filterType"
                value="day"
                checked={filterType === "day"}
                onChange={() => setFilterType("day")}
                className="h-4 w-4 cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-700">Por Período</span>
            </label>
          </div>

          {filterType === "month" ? (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
            >
              <option value="05-2026">Maio 2026</option>
              <option value="04-2026">Abril 2026</option>
              <option value="03-2026">Março 2026</option>
            </select>
          ) : filterType === "year" ? (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="group rounded-lg p-6 transition-all duration-200 border-2 border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg hover:-translate-y-2 hover:shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-orange-700 font-semibold">Total Gasto</h3>
            <TrendingDown className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">R$ {totalGastos.toFixed(2)}</p>
          <p className="mt-2 text-xs text-slate-600">Período selecionado</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-600">Total de Litros</h3>
            <Fuel className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalLitros.toFixed(2)}L</p>
          <p className="mt-2 text-xs text-slate-500">Período selecionado</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-600">
              KM Total
            </h3>

            <TrendingDown className="h-5 w-5 text-purple-500" />
          </div>

          <p className="text-2xl font-bold text-slate-900">
            {totalKmRodados.toLocaleString("pt-BR")} km
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Distância percorrida no período
          </p>
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
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase text-slate-600">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {combustivelFiltrado.map((abast) => {
                const dataFormatada = formatDateBR(abast.data);
                return (
                  <tr key={abast._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{dataFormatada}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{abast.litros}L</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{abast.preco}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{abast.km} km</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{abast.consumo}</td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-orange-600">
                      R$ {abast.valor.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() =>
                          router.push(`/uber/combustivel/${abast._id}`)
                        }
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 p-2 transition hover:bg-slate-100"
                        title="Editar abastecimento"
                      >
                        <Edit className="h-4 w-4 text-slate-600" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Insights
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Preço médio litro */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-600">
              Preço Médio do Litro
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              R${" "}
              {totalLitros > 0
                ? (
                  totalGastos / totalLitros
                ).toFixed(2)
                : "0.00"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Valor médio pago por litro
            </p>
          </div>

          {/* Consumo médio */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-600">
              Consumo Médio
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {totalLitros > 0
                ? (
                  totalKmRodados /
                  totalLitros
                ).toFixed(1)
                : "0.0"}{" "}
              km/L
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Eficiência média do veículo
            </p>
          </div>
        </div>
      </div>{/* Insights */}

    </div>
  );
}
