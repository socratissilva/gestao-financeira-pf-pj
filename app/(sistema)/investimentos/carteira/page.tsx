"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader/PageHeader";
import { notifyPortfolioUpdated } from "@/lib/investimentos/portfolioEvents";
import {
  AlertTriangle,
  Briefcase,
  ChartNoAxesCombined,
  ChevronDown,
  CircleDollarSign,
  LoaderCircle,
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";

type TipoAtivo = "ACAO" | "FII" | "ETF" | "BDR" | "CRIPTO" | "RENDA_FIXA";
type Moeda = "BRL" | "USD" | "EUR" | "GBP";
type HistoryFilterType = "all" | "month" | "year";

interface Posicao {
  ticker: string;
  nome: string;
  tipoAtivo: TipoAtivo;
  setor: string;
  moeda: Moeda;
  quantidade: number;
  precoMedio: number;
  precoAtual: number | null;
  variacaoPercentual: number | null;
  custoBRL: number;
  valorAtualBRL: number | null;
  resultadoBRL: number | null;
  rentabilidadePercentual: number | null;
  fonteCotacao: string;
  cotacaoAtualizadaEm: string | null;
  erroCotacao: string | null;
  cotacaoManual: boolean;
}

interface Operacao {
  id: string;
  ticker: string;
  nome: string;
  lado: "COMPRA" | "VENDA";
  quantidade: number;
  precoUnitario: number;
  moeda: Moeda;
  dataOperacao: string;
}

interface CarteiraData {
  posicoes: Posicao[];
  operacoes: Operacao[];
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
  avisoCotacoes: string;
}

const tiposAtivo: Array<{ value: TipoAtivo; label: string }> = [
  { value: "ACAO", label: "Ação" },
  { value: "FII", label: "FII" },
  { value: "ETF", label: "ETF" },
  { value: "BDR", label: "BDR" },
  { value: "CRIPTO", label: "Criptomoeda" },
  { value: "RENDA_FIXA", label: "Renda fixa" },
];

const gruposPosicoes: Array<{ label: string; tipos: TipoAtivo[] }> = [
  { label: "Ações", tipos: ["ACAO"] },
  { label: "FIIs", tipos: ["FII"] },
  { label: "Renda fixa", tipos: ["RENDA_FIXA"] },
  { label: "ETFs", tipos: ["ETF"] },
  { label: "Outros ativos", tipos: ["BDR", "CRIPTO"] },
];

function formatCurrency(value: number, currency: string = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null) return "—";
  return `${value > 0 ? "+" : ""}${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function tipoLabel(tipo: TipoAtivo) {
  return tiposAtivo.find((item) => item.value === tipo)?.label ?? tipo;
}

export default function CarteiraInvestimentosPage() {
  const [data, setData] = useState<CarteiraData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isOperationModalOpen, setIsOperationModalOpen] = useState(false);
  const [historyFilterType, setHistoryFilterType] = useState<HistoryFilterType>("all");
  const [historyMonth, setHistoryMonth] = useState(new Date().toISOString().slice(0, 7));
  const [historyYear, setHistoryYear] = useState(String(new Date().getFullYear()));
  const [error, setError] = useState("");
  const [assetLookup, setAssetLookup] = useState<{
    loading: boolean;
    message: string;
    source: string;
  }>({ loading: false, message: "", source: "" });
  const [manualPrices, setManualPrices] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    ticker: "",
    nome: "",
    tipoAtivo: "ACAO" as TipoAtivo,
    setor: "",
    lado: "COMPRA" as "COMPRA" | "VENDA",
    quantidade: "",
    precoUnitario: "",
    taxas: "0",
    moeda: "BRL" as Moeda,
    cambio: "1",
    dataOperacao: new Date().toISOString().slice(0, 10),
  });

  const loadPortfolio = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/investimentos/carteira", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível carregar a carteira.");
      setData(result);
      setManualPrices((current) => {
        const next = { ...current };
        for (const position of result.posicoes as Posicao[]) {
          if (position.cotacaoManual && !(position.ticker in next) && position.precoAtual !== null) {
            next[position.ticker] = String(position.precoAtual);
          }
        }
        return next;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar a carteira.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadPortfolio();
    const interval = window.setInterval(() => void loadPortfolio(true), 60_000);
    return () => window.clearInterval(interval);
  }, [loadPortfolio]);

  useEffect(() => {
    const ticker = form.ticker.trim().toUpperCase();
    if (form.tipoAtivo === "RENDA_FIXA") {
      setAssetLookup({
        loading: false,
        message: "Renda fixa: informe o ticker ou identificador manualmente.",
        source: "",
      });
      return;
    }
    if (!ticker) {
      setAssetLookup({ loading: false, message: "", source: "" });
      return;
    }
    if (ticker.length < 2) {
      setAssetLookup({ loading: false, message: "Digite ao menos 2 caracteres para buscar.", source: "" });
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setAssetLookup({ loading: true, message: "Buscando nome e setor...", source: "" });
      try {
        const params = new URLSearchParams({
          ticker,
          tipoAtivo: form.tipoAtivo,
          moeda: form.moeda,
        });
        const response = await fetch(`/api/investimentos/ativos?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Busca de ativo indisponível.");
        if (!result.ativo) {
          setAssetLookup({
            loading: false,
            message: result.error || "Ativo não encontrado; informe os dados manualmente.",
            source: "",
          });
          return;
        }

        setForm((current) => ({
          ...current,
          nome: result.ativo.nome,
          setor: result.ativo.setor,
          ...(result.ativo.moeda
            ? {
                moeda: result.ativo.moeda,
                cambio: result.ativo.moeda === "BRL" ? "1" : current.cambio === "1" ? "" : current.cambio,
              }
            : {}),
        }));
        setAssetLookup({
          loading: false,
          message: "Nome e setor preenchidos automaticamente.",
          source: result.ativo.fonte,
        });
      } catch (lookupError) {
        if (controller.signal.aborted) return;
        setAssetLookup({
          loading: false,
          message: lookupError instanceof Error ? lookupError.message : "Não foi possível buscar este ativo.",
          source: "",
        });
      }
    }, 500);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [form.ticker, form.tipoAtivo, form.moeda]);

  async function submitOperation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/investimentos/carteira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ticker: form.ticker.toUpperCase(),
          quantidade: Number(form.quantidade.replace(",", ".")),
          precoUnitario: Number(form.precoUnitario.replace(",", ".")),
          taxas: Number(form.taxas.replace(",", ".")),
          cambio: Number(form.cambio.replace(",", ".")),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível registrar a operação.");
      notifyPortfolioUpdated();
      setForm((current) => ({
        ...current,
        ticker: "",
        nome: "",
        setor: "",
        quantidade: "",
        precoUnitario: "",
        taxas: "0",
      }));
      setIsOperationModalOpen(false);
      await loadPortfolio(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível registrar a operação.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteOperation(operation: Operacao) {
    if (!window.confirm(`Excluir a operação ${operation.lado.toLowerCase()} de ${operation.ticker}?`)) return;
    setError("");
    try {
      const response = await fetch(`/api/investimentos/carteira?id=${encodeURIComponent(operation.id)}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível excluir a operação.");
      notifyPortfolioUpdated();
      await loadPortfolio(true);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Não foi possível excluir a operação.");
    }
  }

  async function saveManualPrice(ticker: string) {
    const preco = Number((manualPrices[ticker] ?? "").replace(",", "."));
    if (!Number.isFinite(preco) || preco < 0) {
      setError("Informe um preço atual válido para renda fixa.");
      return;
    }
    setError("");
    try {
      const response = await fetch("/api/investimentos/carteira", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, preco }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível atualizar o preço.");
      notifyPortfolioUpdated();
      await loadPortfolio(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível atualizar o preço.");
    }
  }

  const summary = data?.resumo;
  const historyYears = [...new Set([
    String(new Date().getFullYear()),
    ...(data?.operacoes.map((operation) => operation.dataOperacao.slice(0, 4)) ?? []),
  ])].sort((a, b) => b.localeCompare(a));
  const filteredOperations = (data?.operacoes ?? []).filter((operation) => {
    if (historyFilterType === "month") return operation.dataOperacao.slice(0, 7) === historyMonth;
    if (historyFilterType === "year") return operation.dataOperacao.slice(0, 4) === historyYear;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Carteira de investimentos"
        subtitle="Registre suas operações e acompanhe preço médio, saldo e rentabilidade."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <Briefcase className="h-5 w-5 text-slate-500" />
          <div>
            <p className="font-semibold text-slate-800">Sua carteira</p>
            <p className="text-sm text-slate-500">{summary?.quantidadeAtivos ?? 0} ativos em posição</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/investimentos" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
            Ver visão geral
          </Link>
          <button
            type="button"
            onClick={() => {
              setError("");
              setIsOperationModalOpen(true);
            }}
            aria-haspopup="dialog"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" />
            Registrar operação
          </button>
          <button
            type="button"
            onClick={() => void loadPortfolio(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>
      </div>

      {data && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Patrimônio atual",
              value: summary?.valorAtualBRL === null ? "Parcial" : formatCurrency(summary?.valorAtualBRL ?? 0),
              detail: summary?.valuationComplete
                ? "Posições atualizadas"
                : `Subtotal cotado: ${formatCurrency(summary?.valorCotadoBRL ?? 0)}`,
              icon: Briefcase,
              iconStyle: "bg-blue-50 text-blue-700",
              accent: "from-blue-500 to-cyan-400",
              valueStyle: "text-slate-950",
            },
            {
              label: "Total investido",
              value: formatCurrency(summary?.totalInvestidoBRL ?? 0),
              detail: "Custo das posições abertas",
              icon: CircleDollarSign,
              iconStyle: "bg-violet-50 text-violet-700",
              accent: "from-violet-500 to-fuchsia-400",
              valueStyle: "text-slate-950",
            },
            {
              label: "Resultado em aberto",
              value: summary?.lucroNaoRealizadoBRL === null ? "—" : formatCurrency(summary?.lucroNaoRealizadoBRL ?? 0),
              detail: `${formatPercent(summary?.rentabilidadePercentual ?? null)} de rentabilidade`,
              icon: TrendingUp,
              iconStyle: (summary?.lucroNaoRealizadoBRL ?? 0) >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
              accent: (summary?.lucroNaoRealizadoBRL ?? 0) >= 0 ? "from-emerald-500 to-teal-400" : "from-rose-500 to-orange-400",
              valueStyle: (summary?.lucroNaoRealizadoBRL ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700",
            },
            {
              label: "Resultado realizado",
              value: formatCurrency(summary?.lucroRealizadoBRL ?? 0),
              detail: "Vendas já encerradas",
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
      )}

      {isOperationModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="operation-modal-title"
          onClick={(event) => {
            if (event.target === event.currentTarget && !saving) setIsOperationModalOpen(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && !saving) setIsOperationModalOpen(false);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
        >
          <section className="my-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="operation-modal-title" className="text-lg font-bold text-slate-900">Registrar operação</h2>
                <p className="mt-1 text-sm text-slate-500">O preço médio é calculado pelas compras e reduzido proporcionalmente nas vendas.</p>
              </div>
              <button
                type="button"
                aria-label="Fechar formulário de operação"
                onClick={() => setIsOperationModalOpen(false)}
                disabled={saving}
                autoFocus
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {error && (
              <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}
              </div>
            )}
            <form onSubmit={submitOperation} className="grid max-h-[75vh] gap-4 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-semibold text-slate-600">
            Tipo de ativo
            <select
              value={form.tipoAtivo}
              onChange={(event) => {
                const tipoAtivo = event.target.value as TipoAtivo;
                setForm((current) => ({
                  ...current,
                  tipoAtivo,
                  moeda: tipoAtivo === "CRIPTO" ? "USD" : current.moeda,
                  cambio: tipoAtivo === "CRIPTO" && current.moeda === "BRL" ? "" : current.cambio,
                  nome: "",
                  setor: "",
                }));
              }}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal text-slate-900"
            >
              {tiposAtivo.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-600">
            {form.tipoAtivo === "RENDA_FIXA" ? "Ticker / identificador manual" : "Ticker / identificador"}
            <input
              required
              maxLength={20}
              value={form.ticker}
              onChange={(event) => {
                setForm({
                  ...form,
                  ticker: event.target.value.toUpperCase(),
                  nome: "",
                  setor: "",
                  cambio: form.moeda === "BRL" ? "1" : "",
                });
                setAssetLookup({ loading: false, message: "", source: "" });
              }}
              placeholder={
                form.tipoAtivo === "RENDA_FIXA"
                  ? "Ex.: CDB-BANCO-2026"
                  : form.tipoAtivo === "CRIPTO"
                    ? "BTC"
                    : "PETR4 ou AAPL"
              }
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal uppercase text-slate-900"
            />
            {assetLookup.message && (
              <span className={`mt-1 block text-xs font-normal ${assetLookup.loading ? "text-slate-500" : assetLookup.source ? "text-emerald-700" : "text-amber-700"}`}>
                {assetLookup.loading && <LoaderCircle className="mr-1 inline h-3 w-3 animate-spin" />}
                {assetLookup.message}{assetLookup.source ? ` · ${assetLookup.source}` : ""}
              </span>
            )}
          </label>
          <label className="text-sm font-semibold text-slate-600">
            Nome do ativo
            <input required={form.tipoAtivo !== "RENDA_FIXA"} maxLength={120} value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} placeholder={form.tipoAtivo === "RENDA_FIXA" ? "Opcional: descrição do investimento" : "Nome ou descrição"} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-slate-900" />
            {form.tipoAtivo === "RENDA_FIXA" && <span className="mt-1 block text-xs font-normal text-slate-500">Se deixar em branco, o identificador manual será usado como nome.</span>}
          </label>
          <label className="text-sm font-semibold text-slate-600">
            Setor
            <input maxLength={80} value={form.setor} onChange={(event) => setForm({ ...form, setor: event.target.value })} placeholder="Financeiro, energia..." className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-slate-900" />
          </label>
          <label className="text-sm font-semibold text-slate-600">
            Operação
            <select value={form.lado} onChange={(event) => setForm({ ...form, lado: event.target.value as "COMPRA" | "VENDA" })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal text-slate-900">
              <option value="COMPRA">Compra</option>
              <option value="VENDA">Venda</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-600">
            Quantidade
            <input required type="number" min="0.00000001" step="any" value={form.quantidade} onChange={(event) => setForm({ ...form, quantidade: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-slate-900" />
          </label>
          <label className="text-sm font-semibold text-slate-600">
            Preço unitário
            <input required type="number" min="0" step="any" value={form.precoUnitario} onChange={(event) => setForm({ ...form, precoUnitario: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-slate-900" />
          </label>
          <label className="text-sm font-semibold text-slate-600">
            Taxas
            <input type="number" min="0" step="any" value={form.taxas} onChange={(event) => setForm({ ...form, taxas: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-slate-900" />
          </label>
          <label className="text-sm font-semibold text-slate-600">
            Moeda da operação
            <select disabled={form.tipoAtivo === "CRIPTO"} value={form.moeda} onChange={(event) => setForm({ ...form, moeda: event.target.value as Moeda, cambio: event.target.value === "BRL" ? "1" : "" })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal text-slate-900 disabled:bg-slate-100">
              {(["BRL", "USD", "EUR", "GBP"] as Moeda[]).map((currency) => <option key={currency} value={currency}>{currency}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-600">
            Câmbio usado (BRL por moeda)
            <input required type="number" min="0.00000001" step="any" value={form.cambio} onChange={(event) => setForm({ ...form, cambio: event.target.value })} disabled={form.moeda === "BRL"} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-slate-900 disabled:bg-slate-100" />
          </label>
          <label className="text-sm font-semibold text-slate-600">
            Data da operação
            <input required type="date" value={form.dataOperacao} onChange={(event) => setForm({ ...form, dataOperacao: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-slate-900" />
          </label>
          <div className="flex items-end">
            <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Registrar operação
            </button>
          </div>
            </form>
            <p className="mt-3 text-xs text-slate-500">Para ativos em moeda estrangeira, informe o câmbio BRL aplicado na data da operação. Tickers B3 usam o sufixo .SA automaticamente nas consultas.</p>
          </section>
        </div>
      )}

      {error && !isOperationModalOpen && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Briefcase className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Posições atuais</h2>
              <p className="mt-1 text-sm text-slate-500">Ativos agrupados por categoria · valores em BRL pelo câmbio atual.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 sm:self-auto">
            {loading && <LoaderCircle className="h-3.5 w-3.5 animate-spin text-blue-600" />}
            {summary?.quantidadeAtivos ?? 0} {summary?.quantidadeAtivos === 1 ? "ativo" : "ativos"}
          </div>
        </div>
        <div className="space-y-3 p-4 sm:p-5">
          {data && data.posicoes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
              <Briefcase className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 font-semibold text-slate-700">Sua carteira ainda está vazia</p>
              <p className="mt-1 text-sm text-slate-500">Registre sua primeira compra para acompanhar suas posições aqui.</p>
            </div>
          ) : (
            gruposPosicoes.map((group) => {
              const positions = (data?.posicoes ?? []).filter((position) => group.tipos.includes(position.tipoAtivo));
              if (!positions.length) return null;
              const currentValue = positions.reduce((total, position) => total + (position.valorAtualBRL ?? 0), 0);
              const hasUnpricedPosition = positions.some((position) => position.valorAtualBRL === null);
              const investedValue = positions.reduce((total, position) => total + position.custoBRL, 0);

              return (
                <details key={group.label} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white open:border-slate-300">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-4 transition hover:bg-slate-50/80 [&::-webkit-details-marker]:hidden">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
                        {positions.length.toString().padStart(2, "0")}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-bold text-slate-900">{group.label}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {positions.length} {positions.length === 1 ? "ativo" : "ativos"} · Investido {formatCurrency(investedValue)}
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center gap-3 sm:gap-5">
                      <span className="text-right">
                        <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">Valor atual</span>
                        <span className="mt-0.5 block text-sm font-bold text-slate-800">
                          {hasUnpricedPosition ? `Parcial · ${formatCurrency(currentValue)}` : formatCurrency(currentValue)}
                        </span>
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                    </span>
                  </summary>
                  <div className="border-t border-slate-100">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1100px] text-left text-sm">
                        <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                          <tr>{["Ativo", "Setor", "Qtd.", "Preço médio", "Preço atual", "Variação", "Saldo", "Resultado", ""].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {positions.map((position) => (
                            <tr key={position.ticker} className="transition hover:bg-slate-50/70">
                              <td className="px-4 py-4">
                                <p className="font-bold text-slate-900">{position.ticker}</p>
                                <p className="max-w-48 truncate text-xs text-slate-500">{position.nome} · {tipoLabel(position.tipoAtivo)}</p>
                              </td>
                              <td className="px-4 py-4 text-slate-600">{position.setor || "—"}</td>
                              <td className="px-4 py-4 font-medium text-slate-700">{position.quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 8 })}</td>
                              <td className="px-4 py-4 text-slate-700">{formatCurrency(position.precoMedio, position.moeda)}</td>
                              <td className="px-4 py-4">
                                {position.cotacaoManual ? (
                                  <div className="flex items-center gap-2">
                                    <input aria-label={`Preço atual manual de ${position.ticker}`} type="number" min="0" step="any" value={manualPrices[position.ticker] ?? ""} onChange={(event) => setManualPrices({ ...manualPrices, [position.ticker]: event.target.value })} className="w-28 rounded-lg border border-slate-300 px-2 py-1" />
                                    <button type="button" onClick={() => void saveManualPrice(position.ticker)} className="rounded-lg bg-slate-900 px-2 py-1 text-xs font-semibold text-white">Salvar</button>
                                  </div>
                                ) : position.precoAtual === null ? <span title={position.erroCotacao ?? ""} className="text-rose-700">Indisponível</span> : formatCurrency(position.precoAtual, position.moeda)}
                                <p className="mt-1 text-[11px] text-slate-400">
                                  {position.fonteCotacao}
                                  {position.cotacaoAtualizadaEm && ` · ${new Date(position.cotacaoAtualizadaEm).toLocaleString("pt-BR")}`}
                                </p>
                              </td>
                              <td className={`px-4 py-4 font-semibold ${(position.variacaoPercentual ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{position.variacaoPercentual === null ? "—" : formatPercent(position.variacaoPercentual)}</td>
                              <td className="px-4 py-4 font-semibold text-slate-900">{position.valorAtualBRL === null ? "—" : formatCurrency(position.valorAtualBRL)}</td>
                              <td className={`px-4 py-4 font-semibold ${(position.resultadoBRL ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                                {position.resultadoBRL === null ? "—" : formatCurrency(position.resultadoBRL)}
                                <span className="block text-xs">{formatPercent(position.rentabilidadePercentual)}</span>
                              </td>
                              <td className="px-4 py-4">
                                {position.erroCotacao && <span title={position.erroCotacao} className="inline-flex text-amber-600"><AlertTriangle className="h-4 w-4" /></span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </details>
              );
            })
          )}
        </div>
        {data && <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">{data.avisoCotacoes}</p>}
      </section>

      <details className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 transition hover:bg-slate-50/80 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block font-bold text-slate-900">Histórico de operações</span>
            <span className="mt-1 block text-sm text-slate-500">
              {data?.operacoes.length ?? 0} {(data?.operacoes.length ?? 0) === 1 ? "operação registrada" : "operações registradas"}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-slate-100">
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="history-filter-type" className="text-sm font-medium text-slate-600">Exibir</label>
              <select
                id="history-filter-type"
                value={historyFilterType}
                onChange={(event) => setHistoryFilterType(event.target.value as HistoryFilterType)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">Todos</option>
                <option value="month">Por mês</option>
                <option value="year">Por ano</option>
              </select>
              {historyFilterType === "month" && (
                <input
                  aria-label="Filtrar operações por mês"
                  type="month"
                  value={historyMonth}
                  onChange={(event) => setHistoryMonth(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              )}
              {historyFilterType === "year" && (
                <select
                  aria-label="Filtrar operações por ano"
                  value={historyYear}
                  onChange={(event) => setHistoryYear(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  {historyYears.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              )}
            </div>
            <span className="text-xs font-medium text-slate-500">
              {filteredOperations.length} {filteredOperations.length === 1 ? "operação encontrada" : "operações encontradas"}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{["Data", "Operação", "Ativo", "Quantidade", "Preço unitário", "Ação"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOperations.map((operation) => (
                  <tr key={operation.id}>
                    <td className="px-4 py-3 text-slate-600">{new Date(`${operation.dataOperacao.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR")}</td>
                    <td className={`px-4 py-3 font-semibold ${operation.lado === "COMPRA" ? "text-emerald-700" : "text-rose-700"}`}>{operation.lado}</td>
                    <td className="px-4 py-3"><span className="font-semibold text-slate-900">{operation.ticker}</span><span className="ml-2 text-slate-500">{operation.nome}</span></td>
                    <td className="px-4 py-3 text-slate-700">{operation.quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 8 })}</td>
                    <td className="px-4 py-3 text-slate-700">{formatCurrency(operation.precoUnitario, operation.moeda)}</td>
                    <td className="px-4 py-3"><button type="button" aria-label={`Excluir operação de ${operation.ticker}`} onClick={() => void deleteOperation(operation)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
                {!loading && !filteredOperations.length && <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">{data?.operacoes.length ? "Nenhuma operação encontrada neste período." : "Ainda não há operações registradas."}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </div>
  );
}
