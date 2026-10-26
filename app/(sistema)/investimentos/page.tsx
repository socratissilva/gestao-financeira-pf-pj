"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader/PageHeader";
import { calcularPosicoes, type OperacaoCarteira } from "@/lib/investimentos/calculoCarteira";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
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

interface PatrimonialSnapshot {
  dateKey: string;
  valuationComplete: boolean;
  porClasse: Array<{
    tipoAtivo: string;
    investidoBRL: number;
    valorAtualBRL: number | null;
  }>;
}

interface DashboardData {
  operacoes: Array<OperacaoCarteira & {
    id: string;
    tipoAtivo: string;
  }>;
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
  historicoPatrimonial: PatrimonialSnapshot[];
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
const PATRIMONIAL_FILTERS = [
  { value: "TODOS", label: "Todos os tipos" },
  { value: "ACAO", label: "Ações" },
  { value: "FII", label: "FIIs" },
  { value: "ETF", label: "ETFs internacionais" },
  { value: "BDR", label: "BDRs" },
  { value: "CRIPTO", label: "Cripto" },
  { value: "RENDA_FIXA", label: "Renda fixa (inclui Tesouro Direto)" },
];
const PATRIMONIAL_PERIODS = [
  { value: 3, label: "Últimos 3 meses" },
  { value: 6, label: "Últimos 6 meses" },
  { value: 12, label: "Últimos 12 meses" },
  { value: 0, label: "Todo o período" },
];

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

function PieDistributionCard({
  title,
  description,
  data,
  emptyMessage,
}: {
  title: string;
  description: string;
  data: ChartDatum[];
  emptyMessage: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex min-h-[54px] items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-bold text-slate-900">{title}</h2>
          <p className="mt-1 truncate text-sm text-slate-500">{description}</p>
        </div>
        {total > 0 && (
          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {currency(total)}
          </span>
        )}
      </div>

      <div className="h-[320px] shrink-0">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 28, bottom: 8, left: 28 }}>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="46%"
                innerRadius={48}
                outerRadius={94}
                paddingAngle={0}
                labelLine={false}
                label={({ percent: share }) => `${((share ?? 0) * 100).toFixed(0)}%`}
                stroke="none"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={pieTooltipFormatter(data)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-500">
            {emptyMessage}
          </div>
        )}
      </div>

    </section>
  );
}

export default function InvestimentosOverviewPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [patrimonialFilter, setPatrimonialFilter] = useState("TODOS");
  const [patrimonialPeriod, setPatrimonialPeriod] = useState(12);

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
  const assetDistribution = (data?.posicoes ?? [])
    .filter((position) => position.valorAtualBRL !== null)
    .map((position) => ({
      name: position.ticker,
      value: position.valorAtualBRL ?? 0,
    }))
    .sort((a, b) => b.value - a.value);
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
    hasEntries: (data?.operacoes ?? []).some((operation) => operation.tipoAtivo === type),
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
  const monthlySnapshots = useMemo(() => {
    const snapshotsByMonth = new Map<string, PatrimonialSnapshot>();
    for (const snapshot of data?.historicoPatrimonial ?? []) {
      snapshotsByMonth.set(snapshot.dateKey.slice(0, 7), snapshot);
    }
    return snapshotsByMonth;
  }, [data?.historicoPatrimonial]);
  const operationMonths = (data?.operacoes ?? []).map((operation) =>
    new Date(operation.dataOperacao).toISOString().slice(0, 7)
  );
  const recordedMonths = [...new Set([
    ...operationMonths,
    ...monthlySnapshots.keys(),
  ])].sort();
  const currentMonth = new Date();
  const currentMonthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;
  const periodStart = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() - (patrimonialPeriod - 1),
    1
  );
  const periodStartKey = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, "0")}`;
  const visibleMonths = recordedMonths.filter(
    (monthKey) =>
      monthKey <= currentMonthKey &&
      (patrimonialPeriod === 0 || monthKey >= periodStartKey)
  );
  const patrimonialHistory = useMemo(() => {
    const operations = [...(data?.operacoes ?? [])].sort(
      (first, second) =>
        new Date(first.dataOperacao).getTime() - new Date(second.dataOperacao).getTime()
    );

    return visibleMonths.map((monthKey) => {
      const monthStart = new Date(`${monthKey}-01T00:00:00.000Z`);
      const nextMonthStart = new Date(
        Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1)
      );
      const operationsToDate = operations.filter(
        (operation) => new Date(operation.dataOperacao) < nextMonthStart
      );
      const positions = calcularPosicoes(operationsToDate).positions;
      const investedFromOperations = positions
        .filter((position) =>
          patrimonialFilter === "TODOS" || position.tipoAtivo === patrimonialFilter
        )
        .reduce((total, position) => total + position.custoBRL, 0);
      const snapshot = monthlySnapshots.get(monthKey);
      const classSnapshots = snapshot?.porClasse.filter(
        (item) =>
          patrimonialFilter === "TODOS" || item.tipoAtivo === patrimonialFilter
      ) ?? [];
      const invested = snapshot
        ? classSnapshots.reduce((total, item) => total + item.investidoBRL, 0)
        : investedFromOperations;
      const isComplete = snapshot !== undefined && (
        patrimonialFilter === "TODOS"
          ? snapshot.valuationComplete
          : classSnapshots.every((item) => item.valorAtualBRL !== null)
      );
      const currentValue = isComplete
        ? classSnapshots.reduce(
            (total, item) => total + (item.valorAtualBRL ?? 0),
            0
          )
        : null;

      return {
        monthKey,
        investidoBRL: invested,
        ganhoBRL: currentValue !== null ? currentValue - invested : null,
      };
    });
  }, [data?.operacoes, monthlySnapshots, patrimonialFilter, visibleMonths]);
  const hasPatrimonialHistory = patrimonialHistory.some(
    (snapshot) => snapshot.investidoBRL > 0 || (snapshot.ganhoBRL ?? 0) !== 0
  );
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
                icon: BriefcaseBusiness,
                iconStyle: "bg-blue-50 text-blue-700",
                accent: "from-blue-500 to-cyan-400",
                valueStyle: "text-slate-950",
              },
              {
                label: "Total investido",
                value: currency(summary?.totalInvestidoBRL ?? 0),
                detail: "Custo das posições abertas",
                icon: CircleDollarSign,
                iconStyle: "bg-violet-50 text-violet-700",
                accent: "from-violet-500 to-fuchsia-400",
                valueStyle: "text-slate-950",
              },
              {
                label: "Resultado em aberto",
                value: summary?.lucroNaoRealizadoBRL === null ? "—" : currency(summary?.lucroNaoRealizadoBRL ?? 0),
                detail: `${percent(summary?.rentabilidadePercentual ?? null)} sobre o custo`,
                icon: TrendingUp,
                iconStyle: (summary?.lucroNaoRealizadoBRL ?? 0) >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
                accent: (summary?.lucroNaoRealizadoBRL ?? 0) >= 0 ? "from-emerald-500 to-teal-400" : "from-rose-500 to-orange-400",
                valueStyle: (summary?.lucroNaoRealizadoBRL ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700",
              },
              {
                label: "Resultado realizado",
                value: currency(summary?.lucroRealizadoBRL ?? 0),
                detail: "Resultado das vendas registradas",
                icon: ChartNoAxesCombined,
                iconStyle: "bg-amber-50 text-amber-700",
                accent: "from-amber-500 to-yellow-400",
                valueStyle: (summary?.lucroRealizadoBRL ?? 0) >= 0 ? "text-slate-950" : "text-rose-700",
              },
            ].map((card) => (
              <section key={card.label} className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.accent}`} />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{card.label}</p>
                    <p className={`mt-3 text-2xl font-bold tracking-tight ${card.valueStyle}`}>{card.value}</p>
                  </div>
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${card.iconStyle}`}>
                    <card.icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{card.detail}</p>
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

          <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold leading-tight text-slate-800">Evolução do<br className="hidden sm:block" /> Patrimônio</h2>
                <div className="flex flex-wrap gap-2">
                  <label className="relative flex min-w-[170px] flex-1 items-center sm:flex-none">
                    <CalendarDays className="pointer-events-none absolute left-3 h-4 w-4 text-slate-600" />
                    <select
                      aria-label="Período da evolução patrimonial"
                      value={patrimonialPeriod}
                      onChange={(event) => setPatrimonialPeriod(Number(event.target.value))}
                      className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-8 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >
                      {PATRIMONIAL_PERIODS.map((period) => (
                        <option key={period.value} value={period.value}>{period.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-500" />
                  </label>
                  <label className="relative flex min-w-[170px] flex-1 items-center sm:flex-none">
                    <CircleDollarSign className="pointer-events-none absolute left-3 h-4 w-4 text-slate-600" />
                    <select
                      aria-label="Filtrar evolução patrimonial por classe de ativo"
                      value={patrimonialFilter}
                      onChange={(event) => setPatrimonialFilter(event.target.value)}
                      className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-8 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >
                      {PATRIMONIAL_FILTERS.map((filter) => (
                        <option key={filter.value} value={filter.value}>{filter.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-500" />
                  </label>
                </div>
              </div>
              <div className="h-[320px] px-3 pt-2">
                {hasPatrimonialHistory ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={patrimonialHistory} margin={{ top: 12, right: 8, left: 4, bottom: 2 }} barCategoryGap="12%">
                      <CartesianGrid stroke="#dbe4ee" vertical={false} />
                      <XAxis
                        dataKey="monthKey"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#718096", fontSize: 11 }}
                        tickFormatter={(monthKey) => new Date(`${monthKey}-01T00:00:00Z`).toLocaleDateString("pt-BR", {
                          month: "2-digit",
                          year: "2-digit",
                          timeZone: "UTC",
                        })}
                        interval={0}
                        minTickGap={0}
                        height={32}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        width={68}
                        tick={{ fill: "#718096", fontSize: 11 }}
                        tickFormatter={(value) => new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                          maximumFractionDigits: 0,
                        }).format(value)}
                      />
                      <Tooltip
                        labelFormatter={(monthKey) => new Date(`${monthKey}-01T00:00:00Z`).toLocaleDateString("pt-BR", {
                          month: "long",
                          year: "numeric",
                          timeZone: "UTC",
                        })}
                        formatter={(value, name) => [
                          value === null || value === undefined ? "Cotação indisponível" : currency(Number(value)),
                          name === "investidoBRL" ? "Valor aplicado" : "Ganho / perda não realizado",
                        ]}
                        contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.10)" }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="center"
                        iconType="square"
                        iconSize={12}
                        wrapperStyle={{ paddingBottom: 10, fontSize: 12, color: "#475569" }}
                        formatter={(value) => value === "investidoBRL" ? "Valor aplicado" : "Ganho / perda"}
                      />
                      <Bar dataKey="investidoBRL" name="investidoBRL" stackId="patrimonio" fill="#20b778" maxBarSize={80} />
                      <Bar dataKey="ganhoBRL" name="ganhoBRL" stackId="patrimonio" fill="#6366f1" radius={[5, 5, 0, 0]} maxBarSize={80}>
                        {patrimonialHistory.map((snapshot) => (
                          <Cell
                              key={snapshot.monthKey}
                              fill={snapshot.ganhoBRL !== null && snapshot.ganhoBRL < 0 ? "#e11d48" : "#6366f1"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center px-5 text-center text-sm text-slate-500">
                    Ainda não há posições nesta classe para exibir.
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Cada mês com snapshot mostra o valor aplicado e o ganho ou perda não realizado daquele período. Meses sem cotação histórica registrada exibem apenas o valor aplicado.
              </p>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Composição da carteira</h2>
              <p className="mt-1 text-sm text-slate-500">Explore a distribuição dos investimentos por classe e setor.</p>
            </div>
            <div className="grid min-w-0 gap-5 xl:grid-cols-2">
            <PieDistributionCard
              title="Distribuição da carteira"
              description="Alocação atual entre classes de ativos"
              data={classes}
              emptyMessage="Sem dados para exibir."
            />
            <PieDistributionCard
              title="Distribuição por setor"
              description="Valor atual das posições com preço disponível"
              data={sectors}
              emptyMessage="Registre operações e obtenha cotações para ver a distribuição."
            />
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Alocação por ativo</h2>
              <p className="mt-1 text-sm text-slate-500">Compare o peso e o valor de cada posição cotada.</p>
            </div>
            <PieDistributionCard
              title="Distribuição por ativos"
              description="Participação e valor de cada ativo no total cotado da carteira"
              data={assetDistribution}
              emptyMessage="Sem posições cotadas para exibir."
            />
            {unquoted.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                {unquoted.length} ativo(s) sem cotação não entram no gráfico: {unquoted.map((position) => position.ticker).join(", ")}.
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Distribuição dos ativos por classe</h2>
              <p className="mt-1 text-sm text-slate-500">Cada gráfico mostra o peso de cada ativo dentro da respectiva classe.</p>
            </div>
            <div className="grid min-w-0 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
              {assetTypeCharts.filter((chart) => chart.hasEntries).map((chart) => (
                <PieDistributionCard
                  key={chart.title}
                  title={chart.title}
                  description="Distribuição por ativo"
                  data={chart.data}
                  emptyMessage="Não há posições abertas cotadas nesta classe."
                />
              ))}
            </div>
          </section>

          <section className="investment-top-assets-card rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50/70 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900">Maiores posições por valor</h2>
                <p className="mt-1 text-sm text-slate-500">Concentração entre os ativos com cotação disponível</p>
              </div>
              <span className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                TOP {topAssets.length}
              </span>
            </div>
            <div className="mt-4 h-[350px]">
              {topAssets.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topAssets} layout="vertical" margin={{ top: 5, right: 20, left: 8, bottom: 5 }} barCategoryGap="24%">
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 5" horizontal={false} />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      tickFormatter={(value) => new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value)}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={62}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#475569", fontSize: 12, fontWeight: 600 }}
                    />
                    <Tooltip
                      cursor={{ fill: "#f1f5f9", radius: 8 }}
                      formatter={pieTooltipFormatter(topAssets)}
                      contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.10)" }}
                    />
                    <Bar dataKey="value" name="Saldo atual" radius={[0, 8, 8, 0]} maxBarSize={24}>
                      {topAssets.map((asset, index) => (
                        <Cell key={asset.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex h-full items-center justify-center text-sm text-slate-500">Sem posições cotadas para exibir.</div>}
            </div>
          </section>

          <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p>{data.avisoCotacoes} A cotação da visão geral é atualizada a cada 60 segundos enquanto a página está aberta. O histórico patrimonial é registrado uma vez por dia a partir da ativação deste recurso; não há dados históricos anteriores.</p>
          </div>
        </>
      )}
    </div>
  );
}
