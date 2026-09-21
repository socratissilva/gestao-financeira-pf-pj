"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader/PageHeader";
import { BarChart3, Database, Search } from "lucide-react";

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

function FutureMethodSection({ method, description }: { method: string; description: string }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <BarChart3 size={18} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Método de valuation</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">{method}</h2>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
          Em breve
        </span>
      </div>

      <div className="overflow-x-auto p-5">
        <table className="min-w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="min-w-[260px] border-b border-slate-200 px-3 py-2 font-semibold">Método</th>
              <th className="border-b border-slate-200 px-3 py-2 font-semibold">Ticker</th>
              <th className="border-b border-slate-200 px-3 py-2 font-semibold">Preço</th>
              <th className="border-b border-slate-200 px-3 py-2 font-semibold">Preço Teto</th>
              <th className="border-b border-slate-200 px-3 py-2 font-semibold">Indicação</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white">
              <td className="border-b border-slate-200 px-3 py-4">
                <div className="font-semibold text-slate-900">{method}</div>
                <div className="mt-1 text-xs text-slate-500">{description}</div>
              </td>
              <td className="border-b border-slate-200 px-3 py-4 text-slate-400">A definir</td>
              <td className="border-b border-slate-200 px-3 py-4 text-slate-400">A definir</td>
              <td className="border-b border-slate-200 px-3 py-4 text-slate-400">A definir</td>
              <td className="border-b border-slate-200 px-3 py-4 text-slate-400">A definir</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function PrecoTetoPage() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<AtivoRow[]>([]);
  const [customPL, setCustomPL] = useState("");
  const [customPVP, setCustomPVP] = useState("");

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

  useEffect(() => {
    setCustomPL(activeAsset?.["P/L"]?.toString() ?? "");
    setCustomPVP(activeAsset?.["P/VP"]?.toString() ?? "");
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
    <div className="space-y-6">
      <div className="sticky top-0 z-30 space-y-4 bg-slate-50 pb-2 pt-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PageHeader
            title="Preço Teto"
            subtitle="Acompanhe o limite máximo de compra e mantenha a estratégia de investimento sob controle."
          />

          <Link
            href="/investimentos/preco-teto/base-de-dados"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Database size={17} />
            Base de Dados
          </Link>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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

      <FutureMethodSection
        method="Bazin"
        description="Estrutura preparada para análise baseada em dividendos e preço teto."
      />

      <FutureMethodSection
        method="Gordon"
        description="Estrutura preparada para análise baseada em crescimento e dividendos."
      />
    </div>
  );
}
