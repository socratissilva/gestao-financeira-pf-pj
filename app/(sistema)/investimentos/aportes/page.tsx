"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader/PageHeader";
import { Check, Loader2, Pencil, PiggyBank, TrendingUp, X } from "lucide-react";

const months = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

type MonthlyContribution = Record<string, number>;

function createEmptyYear() {
  return Object.fromEntries(months.map((month) => [month, 0]));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function parseCurrency(value: string) {
  const digits = value.replace(/\D/g, "");
  const parsed = Number(digits) / 100;

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatInputValue(value: number) {
  return value ? value.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "";
}

export default function AportesPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [contributions, setContributions] = useState<MonthlyContribution>(createEmptyYear());
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [savingMonth, setSavingMonth] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadContributions() {
      setLoading(true);
      setError("");
      setEditingMonth(null);
      setInputValues({});

      try {
        const response = await fetch(`/api/investimentos/aportes?ano=${selectedYear}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Não foi possível carregar os aportes.");
        if (!ignore) setContributions(data.meses ?? createEmptyYear());
      } catch (loadError) {
        if (!ignore) {
          setContributions(createEmptyYear());
          setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os aportes.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadContributions();
    return () => {
      ignore = true;
    };
  }, [selectedYear]);

  const selectedContributions = contributions;
  const total = Object.values(selectedContributions).reduce((sum, value) => sum + value, 0);
  const monthsWithContribution = Object.values(selectedContributions).filter((value) => value > 0).length;
  const average = monthsWithContribution ? total / monthsWithContribution : 0;
  const highestContribution = Math.max(...Object.values(selectedContributions), 0);

  function updateMonth(month: string, value: string) {
    const inputKey = `${selectedYear}-${month}`;
    const parsedValue = parseCurrency(value);
    const formattedValue = value.replace(/\D/g, "") ? formatInputValue(parsedValue) : "";

    setInputValues((current) => ({ ...current, [inputKey]: formattedValue }));
  }

  function startEditing(month: string) {
    setError("");
    setInputValues((current) => ({
      ...current,
      [`${selectedYear}-${month}`]: formatInputValue(selectedContributions[month] ?? 0),
    }));
    setEditingMonth(month);
  }

  function cancelEditing(month: string) {
    setInputValues((current) => {
      const next = { ...current };
      delete next[`${selectedYear}-${month}`];
      return next;
    });
    setEditingMonth(null);
  }

  async function saveMonth(month: string) {
    const inputKey = `${selectedYear}-${month}`;
    const value = parseCurrency(inputValues[inputKey] ?? formatInputValue(selectedContributions[month] ?? 0));

    setSavingMonth(month);
    setError("");

    try {
      const response = await fetch("/api/investimentos/aportes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ano: selectedYear, mes: month, valor: value }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Não foi possível salvar o aporte.");

      setContributions(data.meses ?? createEmptyYear());
      setInputValues((current) => {
        const next = { ...current };
        delete next[inputKey];
        return next;
      });
      setEditingMonth(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar o aporte.");
    } finally {
      setSavingMonth(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-20 -mx-6 space-y-6 bg-slate-50 px-6 pb-2 pt-1">
        <PageHeader
          title="Aportes"
          subtitle="Acompanhe quanto foi investido em cada mês e mantenha sua constância de aportes."
        />

        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Período de acompanhamento</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Aportes por mês</h2>
          </div>
          <label className="text-sm font-semibold text-slate-600">
            Ano
            <input
              type="number"
              min="1900"
              max="2100"
              step="1"
              value={selectedYear}
              onChange={(event) => {
                const year = Number(event.target.value);
                if (year >= 1900 && year <= 2100) setSelectedYear(year);
              }}
              className="ml-3 w-28 rounded-xl border border-slate-300 bg-white px-4 py-2 font-normal text-slate-900 outline-none focus:border-slate-500"
            />
          </label>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}
      </div>

      <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-3"><PiggyBank className="h-5 w-5 text-emerald-600" /></div>
              <div>
                <p className="text-sm text-slate-500">Total aportado em {selectedYear}</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(total)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Média dos meses com aporte</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(average)}</p>
            <p className="mt-1 text-xs text-slate-400">{monthsWithContribution} de 12 meses registrados</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-sky-100 p-3"><TrendingUp className="h-5 w-5 text-sky-600" /></div>
              <div>
                <p className="text-sm text-slate-500">Maior aporte mensal</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(highestContribution)}</p>
              </div>
            </div>
          </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Distribuição anual</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Evolução dos aportes</h2>
          </div>
          <p className="text-sm text-slate-500">Use o botão de edição para alterar um mês.</p>
        </div>

        <div className="flex h-44 items-end gap-2 border-b border-slate-200 px-1 pb-2 sm:gap-3">
          {months.map((month) => {
            const value = selectedContributions[month] ?? 0;
            const height = highestContribution ? Math.max((value / highestContribution) * 100, value > 0 ? 8 : 0) : 0;

            return (
              <div key={month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <div className="flex min-h-0 w-full flex-1 items-end justify-center">
                  <div className="w-full max-w-12 rounded-t-md bg-emerald-500 transition-all" style={{ height: `${height}%` }} title={`${month}: ${formatCurrency(value)}`} />
                </div>
                <span className="text-[10px] text-slate-500 sm:text-xs">{month.slice(0, 3)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-xl font-semibold text-slate-900">Lançamentos mensais</h2>
          <p className="mt-1 text-sm text-slate-500">Informe o total investido em cada mês de {selectedYear}.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-3 font-semibold">Mês</th>
                <th className="px-5 py-3 font-semibold">Valor do aporte</th>
                <th className="px-5 py-3 text-right font-semibold">Participação no ano</th>
                <th className="px-5 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {months.map((month) => {
                const value = selectedContributions[month] ?? 0;
                const participation = total > 0 ? (value / total) * 100 : 0;

                return (
                  <tr key={month} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{month}</td>
                    <td className="px-5 py-3">
                      <div className="relative max-w-xs">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={inputValues[`${selectedYear}-${month}`] ?? formatInputValue(value)}
                          onChange={(event) => updateMonth(month, event.target.value)}
                          onFocus={(event) => event.currentTarget.select()}
                          disabled={editingMonth !== month || savingMonth === month}
                          placeholder="0,00"
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-right text-slate-700 outline-none disabled:cursor-not-allowed disabled:text-slate-500 focus:border-emerald-500 focus:bg-white"
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-500">{participation.toFixed(1)}%</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        {editingMonth === month ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveMonth(month)}
                              disabled={savingMonth === month}
                              title="Salvar aporte"
                              aria-label={`Salvar aporte de ${month}`}
                              className="rounded-lg bg-emerald-600 p-2 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {savingMonth === month ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => cancelEditing(month)}
                              disabled={savingMonth === month}
                              title="Cancelar edição"
                              aria-label={`Cancelar edição de ${month}`}
                              className="rounded-lg border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditing(month)}
                            disabled={loading || savingMonth !== null}
                            title="Editar aporte"
                            aria-label={`Editar aporte de ${month}`}
                            className="rounded-lg border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50">
              <tr>
                <td className="px-5 py-3 font-bold text-slate-900">Total</td>
                <td className="px-5 py-3 font-bold text-emerald-700">{formatCurrency(total)}</td>
                <td className="px-5 py-3 text-right font-bold text-slate-700">100%</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}