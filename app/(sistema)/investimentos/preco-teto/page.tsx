"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader/PageHeader";
import { Database, FileDown, Search } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const STORAGE_KEY = "preco-teto-base-dados";

const grahamColumns = [
  "LPA",
  "VPA",
  "P/L",
  "P/VP",
  "PRECO",
  "PRECO TETO",
  "MARGEM DE SEGURANCA",
  "INDICACAO",
];

type AtivoRow = Record<string, string | number | undefined>;

function parseNumericValue(value: string | number | undefined) {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const text = String(value).trim();
  if (!text) return 0;

  const normalized = text
    .replace(/R\$|%/gi, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeTicker(value: string) {
  return value.trim().toUpperCase();
}

function formatCurrencyValue(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatGrahamCell(column: string, value: string | number) {
  if (column === "PRECO" || column === "PRECO TETO") {
    return formatCurrencyValue(Number(value) || 0);
  }

  return value;
}

function getRecommendation(precoTeto: number, precoAtual: number) {
  if (precoTeto > precoAtual) return "COMPRAR";
  if (precoTeto < precoAtual) return "NÃO COMPRAR";
  return "AVALIAR";
}

function getDpaValue(asset: AtivoRow, year: number) {
  const possibleKeys = [`DPA ${year}`, `DPA${year}`, `DPA ANO ${year}`, `ANO ${year} DPA`];
  const key = possibleKeys.find((candidate) => asset[candidate] !== undefined);
  return key ? String(asset[key] ?? "") : "";
}

function getAssetValue(asset: AtivoRow, keys: string[]) {
  const key = keys.find((candidate) => asset[candidate] !== undefined);
  return key ? String(asset[key] ?? "") : "";
}

function formatInputNumber(value: string) {
  const cleaned = value.replace(/[^\d,.-]/g, "");
  const negative = cleaned.startsWith("-") ? "-" : "";
  const unsigned = cleaned.replace(/-/g, "");
  const [integerPart = "", decimalPart] = unsigned.split(",");
  const formattedInteger = integerPart.replace(/\./g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${negative}${formattedInteger}${decimalPart !== undefined ? `,${decimalPart}` : ""}`;
}

function getCellTone(value: string) {
  if (value === "COMPRAR") return "font-bold text-emerald-700";
  if (value === "NÃO COMPRAR") return "font-bold text-red-700";
  return "font-semibold text-amber-600";
}

function BazinSection({
  activeAsset,
  dpaValues,
  returnRates,
  onDpaChange,
  onReturnRateChange,
}: {
  activeAsset: AtivoRow | null;
  dpaValues: string[];
  returnRates: string[];
  onDpaChange: (index: number, value: string) => void;
  onReturnRateChange: (index: number, value: string) => void;
}) {
  const precoAtual = parseNumericValue(activeAsset?.PRECO);
  const mediaDpa = dpaValues.reduce((total, value) => total + parseNumericValue(value), 0) / dpaValues.length;
  const scenarios = returnRates.map((rate, index) => {
    const retorno = parseNumericValue(rate) / 100;
    const precoTeto = retorno > 0 ? mediaDpa / retorno : 0;
    const margemSeguranca = precoTeto > 0 && precoAtual > 0 ? ((precoTeto - precoAtual) / precoTeto) * 100 : 0;

    return {
      index,
      retorno: parseNumericValue(rate),
      precoTeto,
      margemSeguranca,
      indicacao: getRecommendation(precoTeto, precoAtual),
    };
  });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Método de valuation</p>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Bazin</h3>
            <p className="mt-1 text-sm text-slate-500">Preço teto = média dos dividendos por ação dos últimos 5 anos ÷ taxa de retorno.</p>
          </div>
          {activeAsset && <span className="text-sm font-semibold text-slate-600">{activeAsset.TICKER ?? "-"} · {formatCurrencyValue(precoAtual)}</span>}
        </div>
      </div>

      {!activeAsset ? (
        <div className="p-6 text-sm text-slate-500">Selecione um ativo para calcular o preço teto pelo método de Bazin.</div>
      ) : (
        <div className="space-y-5 p-5">
          <div className="grid gap-3 sm:grid-cols-5">
            {dpaValues.map((value, index) => (
              <label key={index} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Ano {index + 1} · DPA
                <input
                  type="text"
                  inputMode="decimal"
                  value={value}
                  onChange={(event) => onDpaChange(index, event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
                  placeholder="0,00"
                />
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <span className="text-sm font-semibold text-slate-600">Média dos dividendos anuais</span>
            <span className="text-lg font-bold text-slate-900">{formatCurrencyValue(mediaDpa)}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="border-b border-slate-200 px-3 py-2 font-semibold">Taxa de retorno</th>
                  <th className="border-b border-slate-200 px-3 py-2 font-semibold">Preço atual</th>
                  <th className="border-b border-slate-200 px-3 py-2 font-semibold">Preço teto</th>
                  <th className="border-b border-slate-200 px-3 py-2 font-semibold">Margem de segurança</th>
                  <th className="border-b border-slate-200 px-3 py-2 font-semibold">Indicação</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((scenario) => (
                  <tr key={scenario.index} className="odd:bg-white even:bg-slate-50">
                    <td className="border-b border-slate-200 px-3 py-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={returnRates[scenario.index]}
                          onChange={(event) => onReturnRateChange(scenario.index, event.target.value)}
                          className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 outline-none focus:border-slate-400"
                        />
                        <span>%</span>
                      </div>
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2">{formatCurrencyValue(precoAtual)}</td>
                    <td className={`border-b px-3 py-2 font-semibold ${scenario.precoTeto > precoAtual ? "border-emerald-100 bg-emerald-50 text-emerald-700" : scenario.precoTeto < precoAtual ? "border-red-100 bg-red-50 text-red-700" : "border-amber-100 bg-amber-50 text-amber-700"}`}>
                      {formatCurrencyValue(scenario.precoTeto)}
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2">{scenario.margemSeguranca.toFixed(2)}%</td>
                    <td className="border-b border-slate-200 px-3 py-2"><span className={getCellTone(scenario.indicacao)}>{scenario.indicacao}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function DividendoProjetivoSection({
  activeAsset,
  values,
  onChange,
}: {
  activeAsset: AtivoRow | null;
  values: { shares: string; payout: string; projectedProfit: string; expectedReturn: string };
  onChange: (field: keyof typeof values, value: string) => void;
}) {
  const precoAtual = parseNumericValue(activeAsset?.PRECO);
  const shares = parseNumericValue(values.shares);
  const payout = parseNumericValue(values.payout) / 100;
  const projectedProfit = parseNumericValue(values.projectedProfit);
  const dpa = shares > 0 ? (projectedProfit * payout) / shares : 0;
  const dividendYield = precoAtual > 0 ? (dpa / precoAtual) * 100 : 0;
  const expectedReturn = parseNumericValue(values.expectedReturn) / 100;
  const precoTeto = expectedReturn > 0 ? dpa / expectedReturn : 0;
  const margemSeguranca = precoTeto > 0 && precoAtual > 0 ? ((precoTeto - precoAtual) / precoTeto) * 100 : 0;
  const indication = getRecommendation(precoTeto, precoAtual);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Método de valuation</p>
        <h3 className="mt-1 text-xl font-semibold text-slate-900">Dividendo Projetivo</h3>
        <p className="mt-1 text-sm text-slate-500">Preço teto = DPA projetado ÷ retorno esperado, com DPA baseado no payout e no lucro projetado.</p>
      </div>

      {!activeAsset ? (
        <div className="p-6 text-sm text-slate-500">Selecione um ativo para calcular o dividendo projetivo.</div>
      ) : (
        <div className="space-y-5 p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["shares", "Qde ações", "0"],
              ["payout", "Payout (%)", "72"],
              ["projectedProfit", "Lucro projetado", "R$ 0,00"],
              ["expectedReturn", "Retorno esperado (%)", "12"],
            ].map(([field, label, placeholder]) => (
              <label key={field} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
                <input
                  type="text"
                  inputMode="decimal"
                  value={values[field as keyof typeof values]}
                  onChange={(event) => {
                    const nextValue = field === "shares" || field === "projectedProfit"
                      ? formatInputNumber(event.target.value)
                      : event.target.value;
                    onChange(field as keyof typeof values, nextValue);
                  }}
                  placeholder={placeholder}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
                />
              </label>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {['Ticker', 'Preço', 'Qde ações', 'Payout', 'Lucro Projetado', 'DPA', 'Dividend Yield', 'Retorno Esperado', 'Margem de segurança', 'Preço Teto', 'Indicação'].map((column) => (
                    <th key={column} className="whitespace-nowrap border-b border-slate-200 px-3 py-2 font-semibold">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="odd:bg-white even:bg-slate-50">
                  <td className="border-b border-slate-200 px-3 py-3 font-semibold text-slate-900">{activeAsset.TICKER ?? "-"}</td>
                  <td className="border-b border-slate-200 px-3 py-3">{formatCurrencyValue(precoAtual)}</td>
                  <td className="border-b border-slate-200 px-3 py-3">{shares.toLocaleString("pt-BR")}</td>
                  <td className="border-b border-slate-200 px-3 py-3">{payout * 100}%</td>
                  <td className="border-b border-slate-200 px-3 py-3">{formatCurrencyValue(projectedProfit)}</td>
                  <td className="border-b border-slate-200 px-3 py-3">{formatCurrencyValue(dpa)}</td>
                  <td className="border-b border-slate-200 px-3 py-3">{dividendYield.toFixed(2)}%</td>
                  <td className="border-b border-slate-200 px-3 py-3">{expectedReturn * 100}%</td>
                  <td className="border-b border-slate-200 px-3 py-3">{margemSeguranca.toFixed(2)}%</td>
                  <td className={`border-b px-3 py-3 font-semibold ${precoTeto > precoAtual ? "border-emerald-100 bg-emerald-50 text-emerald-700" : precoTeto < precoAtual ? "border-red-100 bg-red-50 text-red-700" : "border-amber-100 bg-amber-50 text-amber-700"}`}>{formatCurrencyValue(precoTeto)}</td>
                  <td className="border-b border-slate-200 px-3 py-3"><span className={getCellTone(indication)}>{indication}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default function PrecoTetoPage() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<AtivoRow[]>([]);
  const [customPL, setCustomPL] = useState("");
  const [customPVP, setCustomPVP] = useState("");
  const [dpaValues, setDpaValues] = useState(["", "", "", "", ""]);
  const [returnRates, setReturnRates] = useState(["6", "7", "8", "9", "10"]);
  const [projectiveValues, setProjectiveValues] = useState({ shares: "", payout: "", projectedProfit: "", expectedReturn: "" });

  useEffect(() => {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) return;

    try {
      const parsed = JSON.parse(rawData) as { rows?: AtivoRow[] };
      setRows(parsed.rows ?? []);
    } catch {
      setRows([]);
    }
  }, []);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;

    const term = normalizeTicker(search);
    return rows.filter((row) => normalizeTicker(String(row.TICKER ?? "")).includes(term));
  }, [rows, search]);

  const activeAsset = filteredRows[0] ?? null;

  function handleGenerateReport() {
    if (!activeAsset) return;

    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const ticker = String(activeAsset.TICKER ?? "ativo");
    const precoAtual = parseNumericValue(activeAsset.PRECO);
    const formatPdfCurrency = (value: number) => formatCurrencyValue(value);
    const formatPdfPercent = (value: number) => `${value.toFixed(2)}%`;
    const margin = 14;
    let cursorY = 18;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text("Relatório de Preço Teto", margin, cursorY);
    cursorY += 8;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text(`Ticker: ${ticker}   |   Preço atual: ${formatPdfCurrency(precoAtual)}`, margin, cursorY);
    cursorY += 5;
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Gerado em ${new Intl.DateTimeFormat("pt-BR").format(new Date())}`, margin, cursorY);
    pdf.setTextColor(15, 23, 42);
    cursorY += 8;

    const addSection = (title: string, head: string[], body: string[][]) => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text(title, margin, cursorY);
      autoTable(pdf, {
        startY: cursorY + 3,
        margin: { left: margin, right: margin },
        head: [head],
        body,
        theme: "grid",
        styles: { font: "helvetica", fontSize: 8, cellPadding: 2.5, textColor: [30, 41, 59] },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
      cursorY = (pdf as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 11;
    };

    const grahamRows = [
      ["Original", formatPdfCurrency(parseNumericValue(grahamValues.PRECO)), formatPdfCurrency(parseNumericValue(grahamValues["PRECO TETO"])), String(grahamValues["MARGEM DE SEGURANCA"] ?? "-"), String(grahamValues.INDICACAO ?? "-")],
      ["Customizado", formatPdfCurrency(parseNumericValue(customValues.PRECO)), formatPdfCurrency(parseNumericValue(customValues["PRECO TETO"])), String(customValues["MARGEM DE SEGURANCA"] ?? "-"), String(customValues.INDICACAO ?? "-")],
    ];
    addSection("Graham", ["Método", "Preço atual", "Preço teto", "Margem de segurança", "Indicação"], grahamRows);

    const mediaDpa = dpaValues.reduce((total, value) => total + parseNumericValue(value), 0) / dpaValues.length;
    const bazinRows = returnRates.map((rate) => {
      const retorno = parseNumericValue(rate) / 100;
      const precoTeto = retorno > 0 ? mediaDpa / retorno : 0;
      const margem = precoTeto > 0 && precoAtual > 0 ? ((precoTeto - precoAtual) / precoTeto) * 100 : 0;
      return [formatPdfPercent(parseNumericValue(rate)), formatPdfCurrency(mediaDpa), formatPdfCurrency(precoTeto), formatPdfPercent(margem), getRecommendation(precoTeto, precoAtual)];
    });
    addSection("Bazin", ["Retorno", "Média DPA", "Preço teto", "Margem de segurança", "Indicação"], bazinRows);

    const shares = parseNumericValue(projectiveValues.shares);
    const payout = parseNumericValue(projectiveValues.payout) / 100;
    const projectedProfit = parseNumericValue(projectiveValues.projectedProfit);
    const expectedReturn = parseNumericValue(projectiveValues.expectedReturn) / 100;
    const dpa = shares > 0 ? (projectedProfit * payout) / shares : 0;
    const projectivePrice = expectedReturn > 0 ? dpa / expectedReturn : 0;
    const projectiveMargin = projectivePrice > 0 && precoAtual > 0 ? ((projectivePrice - precoAtual) / projectivePrice) * 100 : 0;
    addSection("Dividendo Projetivo", ["Preço", "Qde ações", "Payout", "Lucro projetado", "DPA", "Retorno esperado", "Margem de segurança", "Preço teto", "Indicação"], [[
      formatPdfCurrency(precoAtual), shares.toLocaleString("pt-BR"), formatPdfPercent(payout * 100), formatPdfCurrency(projectedProfit), formatPdfCurrency(dpa), formatPdfPercent(expectedReturn * 100), formatPdfPercent(projectiveMargin), formatPdfCurrency(projectivePrice), getRecommendation(projectivePrice, precoAtual),
    ]]);

    pdf.save(`relatorio-preco-teto-${ticker}.pdf`);
  }

  useEffect(() => {
    setCustomPL(activeAsset?.["P/L"]?.toString() ?? "");
    setCustomPVP(activeAsset?.["P/VP"]?.toString() ?? "");
    setDpaValues(activeAsset ? [1, 2, 3, 4, 5].map((year) => getDpaValue(activeAsset, year)) : ["", "", "", "", ""]);
    setProjectiveValues(activeAsset ? {
      shares: getAssetValue(activeAsset, ["QDE AÇÕES", "QDE ACOES", "QUANTIDADE DE AÇÕES", "QUANTIDADE DE ACOES"]),
      payout: getAssetValue(activeAsset, ["PAYOUT"]),
      projectedProfit: getAssetValue(activeAsset, ["LUCRO PROJETADO", "LUCRO PROJETADO (R$)"]),
      expectedReturn: getAssetValue(activeAsset, ["RETORNO ESPERADO", "RETORNO ESPERADO (%)"]),
    } : { shares: "", payout: "", projectedProfit: "", expectedReturn: "" });
  }, [activeAsset]);

  const grahamValues = useMemo(() => {
    if (!activeAsset) return {} as Record<string, string | number>;

    const lpa = parseNumericValue(activeAsset["LPA"]);
    const vpa = parseNumericValue(activeAsset["VPA"]);
    const precoAtual = parseNumericValue(activeAsset["PRECO"]);

    const precoTeto = Math.sqrt(22.5 * lpa * vpa);
    const margemSeguranca = precoTeto > 0 && precoAtual > 0 ? (((precoTeto - precoAtual) / precoTeto) * 100) : 0;

    return {
      LPA: lpa,
      VPA: vpa,
      "P/L": activeAsset["P/L"] ?? "-",
      "P/VP": activeAsset["P/VP"] ?? "-",
      PRECO: precoAtual,
      "PRECO TETO": precoTeto,
      "MARGEM DE SEGURANCA": `${margemSeguranca.toFixed(2)}%`,
      INDICACAO: getRecommendation(precoTeto, precoAtual),
    };
  }, [activeAsset]);

  const customValues = useMemo(() => {
    if (!activeAsset) return {} as Record<string, string | number>;

    const lpa = parseNumericValue(activeAsset["LPA"]);
    const vpa = parseNumericValue(activeAsset["VPA"]);
    const precoAtual = parseNumericValue(activeAsset["PRECO"]);
    const pl = parseNumericValue(customPL);
    const pvp = parseNumericValue(customPVP);
    const precoTeto = Math.sqrt(pl * pvp * lpa * vpa);
    const margemSeguranca = precoTeto > 0 && precoAtual > 0 ? (((precoTeto - precoAtual) / precoTeto) * 100) : 0;

    return {
      LPA: lpa,
      VPA: vpa,
      "P/L": customPL || "-",
      "P/VP": customPVP || "-",
      PRECO: precoAtual,
      "PRECO TETO": precoTeto,
      "MARGEM DE SEGURANCA": `${margemSeguranca.toFixed(2)}%`,
      INDICACAO: getRecommendation(precoTeto, precoAtual),
    };
  }, [activeAsset, customPL, customPVP]);

  return (
    <div className="price-ceiling-report space-y-6">
      <div className="sticky top-0 z-30 space-y-4 bg-slate-50 pb-2 pt-1 print:static print:bg-transparent print:pt-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PageHeader
            title="Preço Teto"
            subtitle="Acompanhe o limite máximo de compra e mantenha a estratégia de investimento sob controle."
          />

          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={!activeAsset}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileDown size={17} />
              Gerar relatório PDF
            </button>
            <Link
              href="/investimentos/preco-teto/base-de-dados"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Database size={17} />
              Base de Dados
            </Link>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Pesquisa</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">Buscar ativo por ticker</h2>
            </div>

            <label className="relative block w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Digite o ticker, ex: PETR4"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </label>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Método de valuation</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">Graham</h3>
          <p className="mt-1 text-sm text-slate-500">Preço teto = √(22,5 × LPA × VPA), usando lucro e valor patrimonial por ação.</p>
        </div>

        {!rows.length ? (
          <div className="p-6 text-sm text-slate-500">
            Ainda não há dados importados. Vá em <span className="font-semibold text-slate-700">Base de Dados</span> para carregar a planilha do Excel.
          </div>
        ) : !activeAsset ? (
          <div className="p-6 text-sm text-slate-500">
            Nenhum ativo encontrado para o ticker informado.
          </div>
        ) : (
          <div className="overflow-x-auto p-5">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="min-w-[260px] border-b border-slate-200 px-3 py-2 font-semibold">Método</th>
                  <th className="border-b border-slate-200 px-3 py-2 font-semibold">Ticker</th>
                  {grahamColumns.map((column) => (
                    <th key={column} className="border-b border-slate-200 px-3 py-2 font-semibold">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {["Método Original", "Método Customizado"].map((method) => (
                  <tr key={method} className="odd:bg-white even:bg-slate-50">
                    <td className="border-b border-slate-200 px-3 py-2 font-semibold text-slate-900">
                      {method === "Método Original" || method === "Método Customizado" ? (
                        <div>
                          <div>{method}</div>
                          {method === "Método Original" ? (
                            <div className="mt-1 text-xs font-normal text-slate-500">
                              Fórmula base: <strong>√(22,5 × LPA × VPA)</strong>. A constante 22,5 vem de 15 × 1,5, ou seja, o produto dos limites de P/L e o P/VP.
                            </div>
                          ) : (
                            <div className="mt-1 text-xs font-normal text-slate-500">
                              Fórmula: <strong>√(P/L × P/VP × LPA × VPA)</strong>. Utilize P/L e P/VP históricos com LPA e VPA atuais.
                            </div>
                          )}
                        </div>
                      ) : (
                        method
                      )}
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2 font-semibold text-slate-900">
                      {activeAsset.TICKER ?? "-"}
                    </td>
                    {(method === "Método Original" ? grahamValues : customValues) && grahamColumns.map((column) => (
                      <td key={column} className="border-b border-slate-200 px-3 py-2 text-slate-900">
                        {method === "Método Customizado" && (column === "P/L" || column === "P/VP") ? (
                          <input
                            type="text"
                            value={column === "P/L" ? customPL : customPVP}
                            onChange={(event) => {
                              if (column === "P/L") setCustomPL(event.target.value);
                              else setCustomPVP(event.target.value);
                            }}
                            className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 outline-none focus:border-slate-400"
                          />
                        ) : (
                          (() => {
                            const values = method === "Método Original" ? grahamValues : customValues;
                            const value = values[column];
                            const isPriceCeiling = column === "PRECO TETO";
                            const isRecommendation = column === "INDICACAO";
                            const priceTeto = parseNumericValue(value);
                            const currentPrice = parseNumericValue(values.PRECO);
                            const cellClass = isPriceCeiling
                              ? priceTeto > currentPrice
                                ? "border-b border-emerald-100 bg-emerald-50 px-3 py-2 font-semibold text-emerald-700"
                                : priceTeto < currentPrice
                                  ? "border-b border-red-100 bg-red-50 px-3 py-2 font-semibold text-red-700"
                                  : "border-b border-amber-100 bg-amber-50 px-3 py-2 font-semibold text-amber-700"
                              : "border-b border-slate-200 px-3 py-2 text-slate-900";

                            return (
                              <span className={isRecommendation ? value === "COMPRAR" ? "font-bold text-emerald-700" : value === "NÃO COMPRAR" ? "font-bold text-red-700" : "font-semibold text-amber-600" : cellClass}>
                                {value !== undefined ? formatGrahamCell(column, String(value)) : "-"}
                              </span>
                            );
                          })()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <BazinSection
        activeAsset={activeAsset}
        dpaValues={dpaValues}
        returnRates={returnRates}
        onDpaChange={(index, value) => setDpaValues((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))}
        onReturnRateChange={(index, value) => setReturnRates((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))}
      />

      <DividendoProjetivoSection
        activeAsset={activeAsset}
        values={projectiveValues}
        onChange={(field, value) => setProjectiveValues((current) => ({ ...current, [field]: value }))}
      />
    </div>
  );
}
