"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowUpRight, CalendarDays, CheckCircle2, ChevronDown, CircleDollarSign, CreditCard, Plus, Receipt, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { DashboardPieChart } from "@/components/Dashboard/DashboardPieChart";
import { ReceitaDespesaChart } from "@/components/Dashboard/ReceitaDespesaChart";
import { formatCurrency } from "@/utils/formatCurrency";

type FilterType = "month" | "year" | "day";
interface DashboardData {
  mesesDisponiveis: string[];
  resumo: { totalReceitaPrevista: number; totalReceitaRecebida: number; totalReceitaRealizada: number; totalDespesaPrevista: number; totalDespesaPaga: number; saldoEstimado: number; saldoRealizado: number };
  graficos: { receitaDespesaMes: Array<{ mes: string; receitaPrevista: number; receitaRealizada: number; despesaPrevista: number; despesaPaga: number }>; gastosPorCategoria: Array<{ name: string; value: number }>; topCategorias: Array<{ name: string; value: number }> };
}

const money = (value: number) => formatCurrency(value);
function percent(value: number, total: number) { return total ? Math.min(100, Math.round((value / total) * 100)) : 0; }
function monthLabel(value: string) { const [year, month] = value.split("-").map(Number); return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }); }

export default function DashboardPage() {
  const { data: session } = useSession();
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [filterType, setFilterType] = useState<FilterType>("month");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(String(today.getFullYear()));
  const [startMonth, setStartMonth] = useState(currentMonth);
  const [endMonth, setEndMonth] = useState(currentMonth);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ filterType });
    if (filterType === "month") params.set("month", selectedMonth);
    if (filterType === "year") params.set("year", selectedYear);
    if (filterType === "day") { params.set("startMonth", startMonth); params.set("endMonth", endMonth); }
    setLoading(true); setError(false);
    fetch(`/api/financeiro/dashboard?${params.toString()}`).then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.message); return result as DashboardData; }).then((result) => { if (active) setData(result); }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filterType, selectedMonth, selectedYear, startMonth, endMonth]);

  const months = useMemo(() => [...(data?.mesesDisponiveis ?? [])].sort((a, b) => b.localeCompare(a)), [data?.mesesDisponiveis]);
  const years = useMemo(() => [...new Set(months.map((month) => month.slice(0, 4)))], [months]);
  useEffect(() => {
    if (filterType === "month" && months.length && !months.includes(selectedMonth)) setSelectedMonth(months[0]);
    if (filterType === "year" && years.length && !years.includes(selectedYear)) setSelectedYear(years[0]);
  }, [filterType, months, selectedMonth, selectedYear, years]);
  const chartData = useMemo(() => (data?.graficos.receitaDespesaMes ?? []).map((item) => { const receitas = item.receitaRealizada > 0 ? item.receitaRealizada : item.receitaPrevista; const despesas = item.despesaPaga > 0 ? item.despesaPaga : item.despesaPrevista; return { mes: item.mes, receitas, despesas, resultado: receitas - despesas }; }), [data?.graficos.receitaDespesaMes]);

  if (loading && !data) return <DashboardSkeleton />;
  if (error || !data) return <section className="flex min-h-[70vh] items-center justify-center"><div className="max-w-md rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-sm"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600"><Receipt size={22} /></div><h1 className="text-xl font-semibold text-slate-900">Não foi possível carregar o dashboard</h1><p className="mt-2 text-sm text-slate-500">Confira sua conexão e tente novamente.</p><button onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Tentar novamente</button></div></section>;

  const { resumo, graficos } = data;
  const receitaPercentual = percent(resumo.totalReceitaRecebida, resumo.totalReceitaPrevista);
  const despesaPercentual = percent(resumo.totalDespesaPaga, resumo.totalDespesaPrevista);
  const topCategory = graficos.topCategorias[0];
  const periodLabel = filterType === "month" ? monthLabel(selectedMonth) : filterType === "year" ? `Ano de ${selectedYear}` : `${monthLabel(startMonth)} a ${monthLabel(endMonth)}`;

  return <div className="mx-auto max-w-[1500px] space-y-6 pb-8">
    <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Central financeira</p><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Olá, {session?.user?.name || "usuário"}.</h1><p className="mt-2 text-sm text-slate-500">Acompanhe o que entrou, o que saiu e o que merece sua atenção.</p></div><div className="flex flex-wrap gap-3"><Link href="/financeiro/receitas-realizadas/novo" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"><Plus size={17} /> Nova receita</Link><Link href="/financeiro/despesas-realizadas/novo" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Plus size={17} /> Nova despesa</Link></div></header>
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3 text-sm text-slate-600"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><CalendarDays size={17} /></span><span>Exibindo <strong className="font-semibold text-slate-900">{periodLabel}</strong></span>{loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />}</div><div className="flex flex-wrap items-center gap-2">{(["month", "year", "day"] as FilterType[]).map((type) => <button key={type} onClick={() => setFilterType(type)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${filterType === type ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}>{type === "month" ? "Mês" : type === "year" ? "Ano" : "Período"}</button>)}{filterType === "month" && <Select value={selectedMonth} onChange={setSelectedMonth} options={months} labels={months.map(monthLabel)} />}{filterType === "year" && <Select value={selectedYear} onChange={setSelectedYear} options={years} />}{filterType === "day" && <><input aria-label="Mês inicial" type="month" value={startMonth} onChange={(event) => setStartMonth(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700" /><input aria-label="Mês final" type="month" value={endMonth} onChange={(event) => setEndMonth(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700" /></>}</div></section>
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Saldo estimado" value={resumo.saldoEstimado} detail="Receitas previstas menos despesas" icon={<Wallet size={20} />} tone="dark" /><MetricCard label="Receitas no período" value={resumo.totalReceitaPrevista} detail={`${receitaPercentual}% recebido até agora`} icon={<TrendingUp size={20} />} tone="green" /><MetricCard label="Despesas no período" value={resumo.totalDespesaPrevista} detail={`${despesaPercentual}% já pago`} icon={<TrendingDown size={20} />} tone="orange" /><MetricCard label="Saldo realizado" value={resumo.saldoRealizado} detail="Com base no movimento real" icon={<CircleDollarSign size={20} />} tone={resumo.saldoRealizado >= 0 ? "blue" : "red"} /></section>
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]"><div className="min-w-0"><ReceitaDespesaChart data={chartData} /></div><div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Acompanhamento</p><h2 className="mt-1 text-lg font-bold text-slate-900">Execução do orçamento</h2></div><CheckCircle2 className="text-emerald-500" size={22} /></div><ProgressRow label="Receitas recebidas" value={resumo.totalReceitaRecebida} total={resumo.totalReceitaPrevista} color="bg-emerald-500" /><ProgressRow label="Despesas pagas" value={resumo.totalDespesaPaga} total={resumo.totalDespesaPrevista} color="bg-orange-400" /><div className="mt-7 rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">Maior categoria de despesa</p><div className="mt-2 flex items-end justify-between gap-3"><p className="truncate text-base font-bold text-slate-900">{topCategory?.name || "Sem dados"}</p><p className="text-sm font-bold text-slate-700">{topCategory ? money(topCategory.value) : money(0)}</p></div></div><Link href="/financeiro/visao-geral" className="mt-5 flex items-center justify-between text-sm font-semibold text-slate-700 hover:text-emerald-700">Ver análise detalhada <ArrowUpRight size={17} /></Link></div></section>
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><DashboardPieChart data={graficos.gastosPorCategoria} title="Para onde está indo seu dinheiro" /><div className="rounded-lg border border-gray-200 bg-white p-6"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Detalhamento</p><h2 className="mt-1 text-lg font-bold text-slate-900">Principais despesas</h2></div><CreditCard size={20} className="text-slate-400" /></div><div className="space-y-4">{graficos.topCategorias.length ? graficos.topCategorias.slice(0, 5).map((item, index) => <div key={item.name} className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">0{index + 1}</span><div className="min-w-0 flex-1"><div className="mb-1 flex justify-between gap-3 text-sm"><span className="truncate font-medium text-slate-700">{item.name}</span><span className="font-semibold text-slate-900">{money(item.value)}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-800" style={{ width: `${percent(item.value, graficos.topCategorias[0]?.value || 1)}%` }} /></div></div></div>) : <p className="py-8 text-center text-sm text-slate-500">Nenhuma despesa encontrada no período.</p>}</div></div></section>
    <section className="rounded-2xl bg-slate-900 p-6 text-white shadow-lg shadow-slate-900/10 sm:p-8"><div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Próximo passo</p><h2 className="mt-2 text-2xl font-bold">Deixe o próximo mês mais previsível.</h2><p className="mt-2 max-w-xl text-sm text-slate-300">Organize receitas e despesas previstas para enxergar seu saldo antes das decisões.</p></div><Link href="/financeiro/visao-geral" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-900 hover:bg-emerald-50">Abrir visão financeira <ArrowUpRight size={17} /></Link></div></section>
  </div>;
}

function Select({ value, onChange, options, labels = options }: { value: string; onChange: (value: string) => void; options: string[]; labels?: string[] }) { return <label className="relative"><select value={value} onChange={(event) => onChange(event.target.value)} className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold capitalize text-slate-700 outline-none focus:border-emerald-500">{options.map((option, index) => <option key={option} value={option}>{labels[index]}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-2.5 text-slate-400" /></label>; }
function MetricCard({ label, value, detail, icon, tone }: { label: string; value: number; detail: string; icon: React.ReactNode; tone: "dark" | "green" | "orange" | "blue" | "red" }) { const styles = { dark: "bg-slate-900 text-white", green: "border-emerald-100 bg-emerald-50 text-emerald-700", orange: "border-orange-100 bg-orange-50 text-orange-700", blue: "border-sky-100 bg-sky-50 text-sky-700", red: "border-rose-100 bg-rose-50 text-rose-700" }[tone]; return <article className={`rounded-2xl border p-5 shadow-sm ${styles}`}><div className="flex items-start justify-between"><p className={`text-sm font-semibold ${tone === "dark" ? "text-slate-300" : "text-slate-500"}`}>{label}</p><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone === "dark" ? "bg-white/10 text-emerald-300" : "bg-white/75"}`}>{icon}</span></div><p className="mt-5 truncate text-2xl font-bold tracking-tight">{money(value)}</p><p className={`mt-2 text-xs ${tone === "dark" ? "text-slate-400" : "text-slate-500"}`}>{detail}</p></article>; }
function ProgressRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) { const progress = percent(value, total); return <div className="mb-5"><div className="mb-2 flex justify-between gap-3 text-sm"><span className="text-slate-600">{label}</span><span className="font-bold text-slate-900">{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${progress}%` }} /></div><p className="mt-1.5 text-right text-xs text-slate-400">{money(value)} de {money(total)}</p></div>; }
function DashboardSkeleton() { return <div className="mx-auto max-w-[1500px] animate-pulse space-y-6"><div className="h-24 rounded-2xl bg-slate-200" /><div className="h-16 rounded-2xl bg-slate-200" /><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-36 rounded-2xl bg-slate-200" />)}</div><div className="h-[420px] rounded-2xl bg-slate-200" /></div>; }