"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import PageHeader from "@/components/PageHeader/PageHeader";
import { KPICard } from "@/components/Dashboard/KPICard";
import { ReceitaDespesaChart } from "@/components/Dashboard/ReceitaDespesaChart";
import { DashboardPieChart } from "@/components/Dashboard/DashboardPieChart";
import { CategoriasList } from "@/components/Dashboard/CategoriasList";
import { SaldoChart } from "@/components/Dashboard/SaldoChart";
import { formatCurrency } from "@/utils/formatCurrency";
import toast from "react-hot-toast";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
} from "lucide-react";

interface DashboardData {
  mesesDisponiveis: string[];

  resumo: {
    totalReceitaPrevista: number;
    totalReceitaRecebida: number;
    totalReceitaRealizada: number;
    totalDespesaPrevista: number;
    totalDespesaPaga: number;
    saldoEstimado: number;
    saldoRealizado: number;
    periodo: {
      inicio: string;
      fim: string;
      filterType: string;
    };
  };

  graficos: {
    receitaDespesaMes: Array<{
      receitaRecebida: any;
      mes: string;
      receitaPrevista: number;
      receitaRealizada: number;
      despesaPrevista: number;
      despesaPaga: number;
    }>;

    gastosPorCategoria: Array<{
      name: string;
      value: number;
    }>;

    receitasPorCategoria: Array<{
      name: string;
      value: number;
    }>;

    metodosPagamento: Array<{
      name: string;
      value: number;
    }>;

    topCategorias: Array<{
      name: string;
      value: number;
    }>;
  };
}

export default function VisaoGeralFinanceiro() {
  const { data: session } = useSession();
  const [dados, setDados] = useState<DashboardData | null>(null);
  const [carregando, setCarregando] = useState(true);

  const hoje = new Date();

  const mesesDisponiveis = dados?.mesesDisponiveis || [];


  const anosDisponiveis = Array.from(
    new Set(
      mesesDisponiveis.map((m) => m.split("-")[0])
    )
  ).sort((a, b) => Number(b) - Number(a));


  const mesAtual = `${hoje.getFullYear()}-${String(
    hoje.getMonth() + 1
  ).padStart(2, "0")}`;

  const [filterType, setFilterType] = useState<
    "month" | "year" | "day"
  >("month");

  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const [selectedYear, setSelectedYear] =
    useState(String(hoje.getFullYear()));

  const [startMonth, setStartMonth] =
    useState(mesAtual);

  const [endMonth, setEndMonth] =
    useState(mesAtual);


  console.log("REQUEST PARAMS:", {
    filterType,
    selectedMonth,
    selectedYear,
    startMonth,
    endMonth,
  });


  useEffect(() => {
    let ativo = true;

    async function load() {
      setCarregando(true);

      const params = new URLSearchParams();
      params.append("filterType", filterType);

      if (filterType === "month") {
        params.append("month", selectedMonth);
      }

      if (filterType === "year") {
        params.append("year", selectedYear);
      }

      if (filterType === "day") {
        params.append("startMonth", startMonth);
        params.append("endMonth", endMonth);
      }

      const res = await fetch(`/api/financeiro/dashboard?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      if (ativo) {
        setDados(data);
        setCarregando(false);
      }
    }

    load();

    return () => {
      ativo = false;
    };
  }, [filterType, selectedMonth, selectedYear, startMonth, endMonth]);

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!dados?.mesesDisponiveis?.length) return;
    if (initialized) return;

    const hoje = new Date();
    const mesAtual = `${hoje.getFullYear()}-${String(
      hoje.getMonth() + 1
    ).padStart(2, "0")}`;

    const mesesOrdenados = [...dados.mesesDisponiveis].sort((a, b) => {
      const [ay, am] = a.split("-").map(Number);
      const [by, bm] = b.split("-").map(Number);
      return new Date(ay, am - 1).getTime() - new Date(by, bm - 1).getTime();
    });

    setSelectedMonth(
      mesesOrdenados.includes(mesAtual)
        ? mesAtual
        : mesesOrdenados[0]
    );

    setInitialized(true);
  }, [dados?.mesesDisponiveis]);

  async function buscarDados() {
    try {
      setCarregando(true);

      const params = new URLSearchParams();

      params.append("filterType", filterType);

      if (filterType === "month") {
        params.append("month", selectedMonth);
      }

      if (filterType === "year") {
        params.append("year", selectedYear);
      }

      if (filterType === "day") {
        params.append("startMonth", startMonth);
        params.append("endMonth", endMonth);
      }

      const response = await fetch(
        `/api/financeiro/dashboard?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao buscar dados");
      }

      setDados(data);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dashboard");
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            title="Visão Geral Financeira"
            subtitle="Análise completa da sua situação financeira"
          />
          <div className="mt-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            title="Visão Geral Financeira"
            subtitle="Análise completa da sua situação financeira"
          />
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">Nenhum dado disponível</p>
          </div>
        </div>
      </div>
    );
  }

  const { resumo, graficos } = dados;

  const mesAtualRef = `${hoje.getFullYear()}-${String(
    hoje.getMonth() + 1
  ).padStart(2, "0")}`;

  function isFuturo(mes: string) {
    const [y, m] = mes.split("-").map(Number);
    const [cy, cm] = mesAtualRef.split("-").map(Number);

    return new Date(y, m - 1).getTime() > new Date(cy, cm - 1).getTime();
  }

  const dadosGrafico = graficos.receitaDespesaMes.map((item) => {
    const futuro = isFuturo(item.mes);

    return {
      mes: item.mes,
      receitas: futuro ? item.receitaPrevista : item.receitaRealizada,
      despesas: futuro ? item.despesaPrevista : item.despesaPaga,
      resultado:
        (futuro ? item.receitaPrevista : item.receitaRealizada) -
        (futuro ? item.despesaPrevista : item.despesaPaga),
    };
  });

  console.log("Resumo:", resumo);
console.log("Gráfico:", graficos.receitaDespesaMes);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Visão Geral Financeira"
          subtitle="Análise completa da sua situação financeira"
        />

        {/* FILTROS */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
                <span className="text-sm font-medium text-slate-700">
                  Por Mês
                </span>
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
                <span className="text-sm font-medium text-slate-700">
                  Por Ano
                </span>
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
                <span className="text-sm font-medium text-slate-700">
                  Por Período
                </span>
              </label>

            </div>

            {filterType === "month" ? (

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
              >
                {[...mesesDisponiveis]
                  .sort((a, b) => {
                    const [ay, am] = a.split("-").map(Number);
                    const [by, bm] = b.split("-").map(Number);

                    return new Date(ay, am - 1).getTime() - new Date(by, bm - 1).getTime();
                  })
                  .map((mes) => {
                    const [ano, numeroMes] = mes.split("-");

                    const nomeMes = new Date(
                      Number(ano),
                      Number(numeroMes) - 1
                    ).toLocaleDateString("pt-BR", {
                      month: "long",
                    });

                    return (
                      <option key={mes} value={mes}>
                        {nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)} {ano}
                      </option>
                    );
                  })}
              </select>

            ) : filterType === "year" ? (

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
              >
                {anosDisponiveis.map((ano) => (
                  <option key={ano} value={ano}>
                    {ano}
                  </option>
                ))}
              </select>

            ) : (

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="month"
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm"
                />

                <input
                  type="month"
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm"
                />
              </div>

            )}
          </div>
        </div>

        {/* KPIs - Linha 1 */}
        {/* <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            titulo="Saldo Estimado"
            valor={resumo.saldoEstimado}
            tipo={resumo.saldoEstimado >= 0 ? "positivo" : "negativo"}
            icon={<DollarSign />}
          />
          <KPICard
            titulo="Despesa Total (Paga)"
            valor={resumo.saldoRealizado}
            tipo={resumo.saldoRealizado >= 0 ? "positivo" : "negativo"}
            icon={<TrendingUp />}
          />
          <KPICard
            titulo="Receita Total (Prevista)"
            valor={resumo.totalReceitaPrevista}
            tipo="positivo"
            icon={<TrendingUp />}
          />
          <KPICard
            titulo="Despesa Total (Previstas)"
            valor={resumo.totalDespesaPrevista}
            tipo="negativo"
            icon={<TrendingDown />}
          />
          <KPICard
            titulo="Receita Recebida"
            valor={resumo.totalReceitaRealizada}
            tipo="negativo"
            icon={<TrendingDown />}
          />
        </div> */}

        {/* Detalhes de realização */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Taxa de Realização</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Receita Recebida</span>
                  <span className="text-sm font-bold text-green-600">
                    {(
                      (resumo.totalReceitaRecebida / resumo.totalReceitaPrevista) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (resumo.totalReceitaRecebida / resumo.totalReceitaPrevista) *
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Despesa Paga</span>
                  <span className="text-sm font-bold text-red-600">
                    {(
                      (resumo.totalDespesaPaga / resumo.totalDespesaPrevista) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (resumo.totalDespesaPaga / resumo.totalDespesaPrevista) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Receita Recebida</h3>
            <p className="text-2xl font-bold text-green-600 mb-2">
              {formatCurrency(resumo.totalReceitaRecebida)}
            </p>
            <p className="text-sm text-gray-600">
              De {formatCurrency(resumo.totalReceitaPrevista)} previsto
            </p>
            {resumo.totalReceitaRealizada > resumo.totalReceitaPrevista && (
              <p className="text-xs text-green-600 mt-2">
                ✓ Acima da previsão
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Despesa Paga</h3>
            <p className="text-2xl font-bold text-red-600 mb-2">
              {formatCurrency(resumo.totalDespesaPaga)}
            </p>
            <p className="text-sm text-gray-600">
              De {formatCurrency(resumo.totalDespesaPrevista)} previsto
            </p>
            {resumo.totalDespesaPaga < resumo.totalDespesaPrevista && (
              <p className="text-xs text-green-600 mt-2">
                ✓ Abaixo da previsão
              </p>
            )}
          </div>
        </div>

        {/* Estatísticas finais */}
        <div className="mt-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg py-4 px-6 text-white flex flex-col items-center text-center">
            <h3 className="text-base font-semibold">
              Resultado
            </h3>

            <p className="text-2xl font-bold mt-1">
              {formatCurrency(
                resumo.totalReceitaPrevista -
                resumo.totalDespesaPrevista
              )}
            </p>

            <p className="text-blue-100 text-xs mt-1">
              Receita - Despesa
            </p>
          </div>
        </div>

        {/* Gráficos principais - Linha 2 */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ReceitaDespesaChart data={dadosGrafico} />
          </div>

          <div>
            <SaldoChart data={dadosGrafico} />
          </div>
        </div>

        {/* Gráficos de categoria - Linha 3 */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardPieChart
            data={graficos.gastosPorCategoria}
            title="Distribuição de Gastos por Categoria"
          />
          <DashboardPieChart
            data={graficos.receitasPorCategoria}
            title="Distribuição de Receitas por Categoria"
          />
        </div>

        {/* Análises detalhadas - Linha 4 */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoriasList
            dados={graficos.topCategorias}
            titulo="Top 5 Categorias de Despesa"
            limite={5}
          />
          <CategoriasList
            dados={graficos.metodosPagamento}
            titulo="Gastos por Método de Pagamento"
            limite={5}
          />
        </div>



        {/* Estatísticas finais */}
        {/* <div className="mt-8 w-full">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <h3 className="text-lg font-bold mb-2">Diferença Estimada</h3>
            <p className="text-3xl font-bold">
              {formatCurrency(
                resumo.totalReceitaPrevista - resumo.totalDespesaPrevista
              )}
            </p>
            <p className="text-blue-100 text-sm mt-2">
              Receita Prevista - Despesa Prevista
            </p>
          </div> */}

      </div>
    </div>
  );
}