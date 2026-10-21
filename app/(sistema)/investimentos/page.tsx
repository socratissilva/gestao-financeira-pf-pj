"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader/PageHeader";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CircleDollarSign,
  LoaderCircle,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartDatum {
  name: string;
  value: number;
}

interface DashboardData {
  posicoes: Array<{
    ticker: string;
    nome: string;
    tipoAtivo: string;
    moeda: string;
    setor: string;
    valorAtualBRL: number | null;
    resultadoBRL: number | null;
    rentabilidadePercentual: number | null;
    erroCotacao: string | null;
  }>;
  resumo: {
    valorAtualBRL: number | null;
    valorCotadoBRL: number;
    totalInvestidoBRL: number;
    lucroNaoRealizadoBRL: number | null;
    lucroRealizadoBRL: number;
    rentabilidadePercentual: number | null;
    quantidadeAtivos: number;
    valuationComplete: boolean;
    valuationPartial: boolean;
  };
  graficos: {
    porSetor: ChartDatum[];
    porClasse: ChartDatum[];
  };
  avisoCotacoes: string;
}

const COLORS = ["#2563eb", "#0f766e", "#7c3aed", "#f59e0b", "#db2777", "#0891b2", "#65a30d", "#ea580c", "#64748b"];
const CLASS_NAMES: Record<string, string> = {
  ACAO: "Ações",
  FII: "FIIs",
  ETF: "ETFs",
  BDR: "BDRs",
  CRIPTO: "Cripto",
  RENDA_FIXA: "Renda fixa",
};

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function percent(value: number | null) {
  return value === null ? "—" : `${value > 0 ? "+" : ""}${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function pieTooltipFormatter(data: ChartDatum[]) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (value: unknown) => {
    const amount = Number(value);
    const share = total > 0 ? (amount / total) * 100 : 0;
    return `${currency(amount)} · ${share.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`;
  };
}

export default function InvestimentosOverviewPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/investimentos/carteira", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível carregar a visão geral.");
      setData(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar a visão geral.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
    const interval = window.setInterval(() => void loadDashboard(true), 60_000);
    return () => window.clearInterval(interval);
  }, [loadDashboard]);

  const unquoted = data?.posicoes.filter((position) => position.valorAtualBRL === null) ?? [];
  const sectors = data?.graficos.porSetor ?? [];
  const classes = (data?.graficos.porClasse ?? []).map((item) => ({
    ...item,
    name: CLASS_NAMES[item.name] ?? item.name,
  }));
  const assetTypeCharts = [
    { type: "ACAO", title: "Ações" },
    { type: "ETF", title: "ETFs (internacionais)" },
    { type: "FII", title: "FIIs" },
    { type: "BDR", title: "BDRs" },
    { type: "CRIPTO", title: "Criptomoedas" },
    { type: "RENDA_FIXA", title: "Renda fixa" },
  ].map(({ type, title }) => ({
    title,
    data: (data?.posicoes ?? [])
      .filter((position) => position.tipoAtivo === type && position.valorAtualBRL !== null)
      .map((position) => ({
        name: position.ticker,
        value: position.valorAtualBRL ?? 0,
      }))
      .filter((position) => position.value > 0)
      .sort((a, b) => b.value - a.value),
  }));
  const topAssets = [...(data?.posicoes ?? [])]
    .filter((position) => position.valorAtualBRL !== null)
    .sort((a, b) => (b.valorAtualBRL ?? 0) - (a.valorAtualBRL ?? 0))
    .slice(0, 8)
    .map((position) => ({ name: position.ticker, value: position.valorAtualBRL ?? 0 }));
  const summary = data?.resumo;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investimentos · Visão geral"
        subtitle="Patrimônio, rentabilidade e distribuição da carteira por classe e setor."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <CircleDollarSign className="h-5 w-5 text-slate-500" />
          <div>
            <p className="font-semibold text-slate-800">Resumo da carteira</p>
            <p className="text-sm text-slate-500">Composição baseada nas posições com cotação disponível</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/investimentos/carteira" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            <BriefcaseBusiness className="h-4 w-4" /> Abrir carteira <ArrowRight className="h-4 w-4" />
          </Link>
          <button type="button" onClick={() => void loadDashboard(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Atualizar
          </button>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}
      {loading && !data && <div className="flex justify-center rounded-2xl border border-slate-200 bg-white py-16"><LoaderCircle className="h-7 w-7 animate-spin text-slate-500" /></div>}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Patrimônio atual",
                value: summary?.valorAtualBRL === null ? "Parcial" : currency(summary?.valorAtualBRL ?? 0),
                detail: summary?.valuationComplete
                  ? "Todas as posições cotadas"
                  : `Subtotal cotado: ${currency(summary?.valorCotadoBRL ?? 0)} · ${unquoted.length} ativo(s) sem preço`,
              },
              { label: "Total investido", value: currency(summary?.totalInvestidoBRL ?? 0), detail: "Custo das posições abertas" },
              {
                label: "Resultado em aberto",
                value: summary?.lucroNaoRealizadoBRL === null ? "—" : currency(summary?.lucroNaoRealizadoBRL ?? 0),
                detail: `${percent(summary?.rentabilidadePercentual ?? null)} sobre o custo`,
                positive: (summary?.lucroNaoRealizadoBRL ?? 0) >= 0,
              },
              { label: "Resultado realizado", value: currency(summary?.lucroRealizadoBRL ?? 0), detail: "Resultado das vendas registradas" },
            ].map((card, index) => (
              <section key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  {index === 2 ? <TrendingUp className="h-4 w-4 text-slate-400" /> : <CircleDollarSign className="h-4 w-4 text-slate-400" />}
                </div>
                <p className={`mt-3 text-2xl font-bold ${card.positive === undefined ? "text-slate-900" : card.positive ? "text-emerald-700" : "text-rose-700"}`}>{card.value}</p>
                <p className="mt-1 text-xs text-slate-500">{card.detail}</p>
              </section>
            ))}
          </div>

          {!summary?.valuationComplete && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Valuation incompleto</p>
                <p>{unquoted.length ? `Sem preço atual: ${unquoted.map((position) => position.ticker).join(", ")}. ` : ""}O patrimônio e as distribuições não somam ativos sem cotação. Confira os detalhes na carteira.</p>
              </div>
            </div>
          )}

          <div className="grid gap-5 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-900">Distribuição por setor</h2>
              <p className="mt-1 text-sm text-slate-500">Valor atual das posições com preço disponível</p>
              <div className="mt-4 h-[320px]">
                {sectors.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sectors} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={65} outerRadius={105} paddingAngle={2}>
                        {sectors.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={pieTooltipFormatter(sectors)} />
                      <Legend verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="flex h-full items-center justify-center text-sm text-slate-500">Registre operações e obtenha cotações para ver a distribuição.</div>}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-900">Distribuição por classe</h2>
              <p className="mt-1 text-sm text-slate-500">Alocação atual entre classes de ativos</p>
              <div className="mt-4 h-[320px]">
                {classes.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={classes} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={65} outerRadius={105} paddingAngle={2}>
                        {classes.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={pieTooltipFormatter(classes)} />
                      <Legend verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="flex h-full items-center justify-center text-sm text-slate-500">Sem dados para exibir.</div>}
              </div>
            </section>

          </div>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Distribuição dos ativos por classe</h2>
              <p className="mt-1 text-sm text-slate-500">Cada gráfico mostra o peso de cada ativo dentro da respectiva classe.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {assetTypeCharts.map((chart) => (
                <section key={chart.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-bold text-slate-900">{chart.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">Distribuição por ativo</p>
                  <div className="mt-4 h-[300px]">
                    {chart.data.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chart.data} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={58} outerRadius={95} paddingAngle={2}>
                            {chart.data.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={pieTooltipFormatter(chart.data)} />
                          <Legend verticalAlign="bottom" />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-500">
                        Nenhum ativo cotado nesta classe.
                      </div>
                    )}
                  </div>
                </section>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">Maiores posições por valor</h2>
            <p className="mt-1 text-sm text-slate-500">Concentração entre os ativos com cotação disponível</p>
            <div className="mt-4 h-[350px]">
              {topAssets.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topAssets} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(value) => new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value)} />
                    <YAxis type="category" dataKey="name" width={70} />
                    <Tooltip formatter={(value) => currency(Number(value))} />
                    <Bar dataKey="value" name="Saldo atual" fill="#2563eb" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex h-full items-center justify-center text-sm text-slate-500">Sem posições cotadas para exibir.</div>}
            </div>
          </section>

          <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p>{data.avisoCotacoes} A atualização automática é feita a cada 60 segundos enquanto a página está aberta. A visão geral mostra a composição atual; ainda não há série histórica de patrimônio.</p>
          </div>
        </>
      )}
    </div>
  );
}
