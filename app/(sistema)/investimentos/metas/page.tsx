"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader/PageHeader";
import {
  AlertTriangle,
  ChartPie,
  ChevronDown,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import toast from "react-hot-toast";

type GroupKey = "etfs" | "fiis" | "acoes";

interface AssetAllocation {
  ticker: string;
  percentual: number;
}

interface AllocationGroup {
  percentual: number;
  ativos: AssetAllocation[];
}

interface InvestmentStudy {
  id: string;
  nome: string;
  rendaVariavelPercentual: number;
  rendaFixaPercentual: number;
  distribuicaoVariavel: Record<GroupKey, AllocationGroup>;
  distribuicaoRendaFixa: {
    ativos: Array<{ nome: string; percentual: number }>;
  };
  createdAt: string;
}

interface ChartDatum {
  name: string;
  value: number;
  color: string;
}

interface DraftGroup extends AllocationGroup {
  key: GroupKey;
  label: string;
  color: string;
}

const GROUP_INFO: Array<Pick<DraftGroup, "key" | "label" | "color">> = [
  { key: "etfs", label: "ETFs internacionais", color: "#2563eb" },
  { key: "fiis", label: "FIIs", color: "#0f766e" },
  { key: "acoes", label: "Ações", color: "#ea580c" },
];

const INITIAL_GROUPS: DraftGroup[] = [
  { ...GROUP_INFO[0], percentual: 25, ativos: [{ ticker: "", percentual: 100 }] },
  { ...GROUP_INFO[1], percentual: 35, ativos: [{ ticker: "", percentual: 100 }] },
  { ...GROUP_INFO[2], percentual: 40, ativos: [{ ticker: "", percentual: 100 }] },
];

const GROUP_PALETTES: Record<GroupKey | "rendaFixa", string[]> = {
  etfs: ["#2563eb", "#60a5fa", "#1d4ed8", "#93c5fd", "#1e40af", "#3b82f6"],
  fiis: ["#0f766e", "#2dd4bf", "#115e59", "#5eead4", "#134e4a", "#14b8a6"],
  acoes: ["#ea580c", "#fb923c", "#c2410c", "#fdba74", "#9a3412", "#f97316"],
  rendaFixa: ["#334155", "#64748b", "#475569", "#94a3b8", "#1e293b", "#cbd5e1"],
};
const CATEGORY_COLORS: Record<GroupKey | "rendaFixa", string> = {
  etfs: "#2563eb",
  fiis: "#0f766e",
  acoes: "#ea580c",
  rendaFixa: "#334155",
};
const TOTAL_TOLERANCE = 0.011;

function nearOneHundred(value: number) {
  return Math.abs(value - 100) < TOTAL_TOLERANCE;
}

function formattedPercent(value: number) {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}

function buildCategoryChartData(
  rendaVariavelPercentual: number,
  rendaFixaPercentual: number,
  groups: Array<Pick<DraftGroup, "key" | "label" | "percentual">>
): ChartDatum[] {
  return [
    {
      name: "Renda fixa",
      value: rendaFixaPercentual,
      color: CATEGORY_COLORS.rendaFixa,
    },
    ...groups.map((group) => ({
      name: group.label,
      value: (rendaVariavelPercentual * group.percentual) / 100,
      color: CATEGORY_COLORS[group.key],
    })),
  ];
}

function buildAssetChartData(
  assets: Array<{ name: string; percentual: number }>,
  palette: string[],
  fallbackName: string
): ChartDatum[] {
  return assets.flatMap((asset, index) => {
    if (asset.percentual <= 0) return [];
    return [{
      name: asset.name.trim() || `${fallbackName} ${index + 1}`,
      value: asset.percentual,
      color: palette[index % palette.length],
    }];
  });
}

function PieComposition({
  data,
  emptyMessage,
  compact = false,
}: {
  data: ChartDatum[];
  emptyMessage: string;
  compact?: boolean;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={`${compact ? "h-56" : "h-64"} min-w-0`}>
      {total > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={compact ? 44 : 52}
              outerRadius={compact ? 82 : 96}
              paddingAngle={1}
              stroke="white"
              strokeWidth={2}
            >
              {data.map((item, index) => (
                <Cell key={`${item.name}-${index}`} fill={item.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formattedPercent(Number(value))}
              contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0" }}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center px-5 text-center text-sm text-slate-500">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

export default function InvestimentosMetasPage() {
  const [nome, setNome] = useState("");
  const [rendaVariavelPercentual, setRendaVariavelPercentual] = useState(60);
  const rendaFixaPercentual = 100 - rendaVariavelPercentual;
  const [rendaFixaAtivos, setRendaFixaAtivos] = useState([{ nome: "", percentual: 100 }]);
  const [groups, setGroups] = useState<DraftGroup[]>(INITIAL_GROUPS);
  const [studies, setStudies] = useState<InvestmentStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const loadStudies = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/investimentos/metas", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível carregar os estudos.");
      setStudies(result.estudos);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os estudos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStudies();
  }, [loadStudies]);

  const categoryTotal = groups.reduce((sum, group) => sum + group.percentual, 0);
  const compositionIsBalanced =
    Number.isFinite(rendaVariavelPercentual) &&
    rendaVariavelPercentual >= 0 &&
    rendaVariavelPercentual <= 100 &&
    nearOneHundred(rendaFixaAtivos.reduce((sum, asset) => sum + asset.percentual, 0)) &&
    rendaFixaAtivos.every((asset) =>
      Number.isFinite(asset.percentual) && asset.percentual >= 0 && asset.percentual <= 100
    ) &&
    nearOneHundred(categoryTotal) &&
    groups.every((group) =>
      Number.isFinite(group.percentual) &&
      group.percentual >= 0 &&
      group.percentual <= 100 &&
      nearOneHundred(group.ativos.reduce((sum, asset) => sum + asset.percentual, 0)) &&
      group.ativos.every((asset) =>
        Number.isFinite(asset.percentual) && asset.percentual >= 0 && asset.percentual <= 100
      )
    );
  const previewCategoryData = useMemo(
    () => compositionIsBalanced
      ? buildCategoryChartData(rendaVariavelPercentual, rendaFixaPercentual, groups)
      : [],
    [compositionIsBalanced, groups, rendaFixaPercentual, rendaVariavelPercentual]
  );
  const previewSegmentCharts = useMemo(
    () => [
      {
        key: "rendaFixa",
        title: "Renda fixa",
        data: buildAssetChartData(
          rendaFixaAtivos.map((asset) => ({ name: asset.nome, percentual: asset.percentual })),
          GROUP_PALETTES.rendaFixa,
          "Renda fixa"
        ),
      },
      ...groups.map((group) => ({
        key: group.key,
        title: group.label,
        data: buildAssetChartData(
          group.ativos.map((asset) => ({ name: asset.ticker, percentual: asset.percentual })),
          GROUP_PALETTES[group.key],
          group.label
        ),
      })),
    ],
    [groups, rendaFixaAtivos]
  );

  function updateGroupPercent(key: GroupKey, percentual: number) {
    setGroups((current) => current.map((group) =>
      group.key === key ? { ...group, percentual } : group
    ));
  }

  function updateAsset(key: GroupKey, index: number, property: keyof AssetAllocation, value: string | number) {
    setGroups((current) => current.map((group) =>
      group.key === key
        ? {
            ...group,
            ativos: group.ativos.map((asset, assetIndex) =>
              assetIndex === index ? { ...asset, [property]: value } : asset
            ),
          }
        : group
    ));
  }

  function addAsset(key: GroupKey) {
    setGroups((current) => current.map((group) => {
      if (group.key !== key) return group;
      const currentTotal = group.ativos.reduce((sum, asset) => sum + asset.percentual, 0);
      return {
        ...group,
        ativos: [
          ...group.ativos.map((asset) => ({ ...asset })),
          { ticker: "", percentual: Math.max(0, 100 - currentTotal) },
        ],
      };
    }));
  }

  function removeAsset(key: GroupKey, index: number) {
    setGroups((current) => current.map((group) => {
      if (group.key !== key || group.ativos.length <= 1) return group;
      const ativos = group.ativos.filter((_, assetIndex) => assetIndex !== index);
      const remainingTotal = ativos.reduce((sum, asset) => sum + asset.percentual, 0);
      if (remainingTotal < 100) ativos[0] = { ...ativos[0], percentual: ativos[0].percentual + 100 - remainingTotal };
      return { ...group, ativos };
    }));
  }

  function updateFixedIncomeAsset(index: number, property: "nome" | "percentual", value: string | number) {
    setRendaFixaAtivos((current) => current.map((asset, assetIndex) =>
      assetIndex === index ? { ...asset, [property]: value } : asset
    ));
  }

  function addFixedIncomeAsset() {
    setRendaFixaAtivos((current) => {
      const currentTotal = current.reduce((sum, asset) => sum + asset.percentual, 0);
      return [...current, { nome: "", percentual: Math.max(0, 100 - currentTotal) }];
    });
  }

  function removeFixedIncomeAsset(index: number) {
    setRendaFixaAtivos((current) => {
      if (current.length <= 1) return current;
      const assets = current.filter((_, assetIndex) => assetIndex !== index);
      const remainingTotal = assets.reduce((sum, asset) => sum + asset.percentual, 0);
      if (remainingTotal < 100) {
        assets[0] = { ...assets[0], percentual: assets[0].percentual + 100 - remainingTotal };
      }
      return assets;
    });
  }

  function validateDraft() {
    if (!nome.trim()) return "Dê um nome para este estudo.";
    if (nome.trim().length > 80) return "O nome deve ter no máximo 80 caracteres.";
    if (!Number.isFinite(rendaVariavelPercentual) || rendaVariavelPercentual < 0 || rendaVariavelPercentual > 100) {
      return "A renda variável deve ficar entre 0% e 100%.";
    }
    const fixedIncomeTotal = rendaFixaAtivos.reduce((sum, asset) => sum + asset.percentual, 0);
    if (!nearOneHundred(fixedIncomeTotal)) {
      return "Os percentuais dos ativos de renda fixa devem totalizar 100%.";
    }
    for (const asset of rendaFixaAtivos) {
      if (asset.percentual < 0 || asset.percentual > 100 || !Number.isFinite(asset.percentual)) {
        return "Confira os percentuais dos ativos de renda fixa.";
      }
      if (rendaFixaPercentual > 0 && asset.percentual > 0 && !asset.nome.trim()) {
        return "Informe o nome de cada ativo de renda fixa com percentual maior que zero.";
      }
      if (asset.nome.trim().length > 80) {
        return "O nome de cada ativo de renda fixa deve ter no máximo 80 caracteres.";
      }
    }
    if (!nearOneHundred(categoryTotal)) {
      return "A divisão entre ETFs, FIIs e ações deve totalizar 100%.";
    }
    for (const group of groups) {
      if (group.percentual < 0 || group.percentual > 100 || !Number.isFinite(group.percentual)) {
        return `O percentual de ${group.label} deve ficar entre 0% e 100%.`;
      }
      const assetTotal = group.ativos.reduce((sum, asset) => sum + asset.percentual, 0);
      if (!nearOneHundred(assetTotal)) {
        return `Os percentuais dos ativos em ${group.label} devem totalizar 100%.`;
      }
      for (const asset of group.ativos) {
        if (asset.percentual < 0 || asset.percentual > 100 || !Number.isFinite(asset.percentual)) {
          return `Confira os percentuais de ${group.label}.`;
        }
        if (rendaVariavelPercentual > 0 && group.percentual > 0 && asset.percentual > 0 && !asset.ticker.trim()) {
          return `Informe o ticker de cada ativo em ${group.label}.`;
        }
        if (asset.ticker.trim() && !/^[A-Za-z0-9.^=+-]{1,20}$/.test(asset.ticker.trim())) {
          return `O ticker "${asset.ticker}" é inválido.`;
        }
      }
    }
    return "";
  }

  async function saveStudy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const validationError = validateDraft();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const distribuicaoVariavel = Object.fromEntries(
        groups.map(({ key, percentual, ativos }) => [
          key,
          {
            percentual,
            ativos: ativos.map((asset) => ({
              ticker: asset.ticker.trim().toUpperCase(),
              percentual: asset.percentual,
            })),
          },
        ])
      );
      const response = await fetch("/api/investimentos/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          rendaVariavelPercentual,
          rendaFixaPercentual,
          distribuicaoVariavel,
          distribuicaoRendaFixa: {
            ativos: rendaFixaAtivos.map((asset) => ({
              nome: asset.nome.trim(),
              percentual: asset.percentual,
            })),
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível salvar o estudo.");

      setStudies((current) => [result, ...current]);
      setNome("");
      setRendaVariavelPercentual(60);
      setRendaFixaAtivos([{ nome: "", percentual: 100 }]);
      setGroups(INITIAL_GROUPS.map((group) => ({
        ...group,
        ativos: group.ativos.map((asset) => ({ ...asset })),
      })));
      toast.success("Estudo salvo com sucesso!");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar o estudo.");
    } finally {
      setSaving(false);
    }
  }

  function confirmDeleteStudy(id: string, name: string) {
    toast((t) => (
      <div className="flex min-w-[280px] flex-col gap-3">
        <p className="font-medium text-slate-900">Excluir estudo?</p>
        <p className="text-sm text-slate-500">
          O estudo &quot;{name}&quot; será removido permanentemente.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              toast.dismiss(t.id);
              void deleteStudy(id);
            }}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
          >
            Excluir
          </button>
        </div>
      </div>
    ), { duration: 10_000 });
  }

  async function deleteStudy(id: string) {
    setError("");
    setDeletingId(id);
    try {
      const response = await fetch(`/api/investimentos/metas?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível excluir o estudo.");
      setStudies((current) => current.filter((study) => study.id !== id));
      toast.success("Estudo excluído com sucesso!");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Não foi possível excluir o estudo.");
    } finally {
      setDeletingId("");
    }
  }

  function getStudyCategoryChartData(study: InvestmentStudy) {
    return buildCategoryChartData(
      study.rendaVariavelPercentual,
      study.rendaFixaPercentual,
      GROUP_INFO.map((info) => ({
        ...info,
        ...study.distribuicaoVariavel[info.key],
      }))
    );
  }

  function getStudySegmentCharts(study: InvestmentStudy) {
    return [
      {
        key: "rendaFixa",
        title: "Renda fixa",
        data: buildAssetChartData(
          (study.distribuicaoRendaFixa?.ativos ?? [
            { nome: "Renda fixa", percentual: 100 },
          ]).map((asset) => ({
            name: asset.nome,
            percentual: asset.percentual,
          })),
          GROUP_PALETTES.rendaFixa,
          "Renda fixa"
        ),
      },
      ...GROUP_INFO.map((group) => ({
        key: group.key,
        title: group.label,
        data: buildAssetChartData(
          study.distribuicaoVariavel[group.key].ativos.map((asset) => ({
            name: asset.ticker,
            percentual: asset.percentual,
          })),
          GROUP_PALETTES[group.key],
          group.label
        ),
      })),
    ];
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investimentos · Metas"
        subtitle="Monte uma carteira de referência, distribua os percentuais por classe e salve diferentes estudos."
      />

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <div>
        <form onSubmit={saveStudy} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Novo estudo de carteira</h2>
            <p className="mt-1 text-sm text-slate-500">Defina as proporções desejadas. Os gráficos mostram a participação de cada item no total da carteira.</p>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Nome do estudo</span>
            <input
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              maxLength={80}
              placeholder="Ex.: Carteira de longo prazo"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4">
              <h3 className="font-semibold text-slate-900">Distribuição da carteira</h3>
              <p className="mt-1 text-sm text-slate-500">Defina a parcela de renda variável; renda fixa completa automaticamente o total da carteira.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Renda variável</span>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={rendaVariavelPercentual}
                    onChange={(event) => setRendaVariavelPercentual(Number(event.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-9 text-sm"
                    aria-label="Percentual de renda variável"
                  />
                  <span className="absolute right-3 top-2 text-sm text-slate-500">%</span>
                </div>
              </label>
              <div>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Renda fixa</span>
                <div
                  aria-label={`Percentual de renda fixa: ${formattedPercent(rendaFixaPercentual)}`}
                  className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  {formattedPercent(rendaFixaPercentual)}
                </div>
              </div>
            </div>
          </section>

          <details className="group rounded-xl border border-slate-200 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
              <span className="flex min-w-0 items-center gap-3">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_COLORS.rendaFixa }} />
                <span className="min-w-0">
                  <span className="block font-semibold text-slate-900">Renda fixa</span>
                  <span className="block text-sm text-slate-500">Editar produtos e visualizar a distribuição</span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Carteira: {formattedPercent(rendaFixaPercentual)}
                </span>
                <ChevronDown className="h-5 w-5 text-slate-500 transition-transform group-open:rotate-180" />
              </span>
            </summary>
            <div className="grid gap-5 border-t border-slate-100 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.8fr)]">
              <div>
                <p className="mb-3 text-sm text-slate-500">Distribua 100% da renda fixa entre os produtos.</p>
                <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Produto de renda fixa</span>
                  <span className="pr-10">Participação na renda fixa</span>
                </div>
                <div className="space-y-2">
                  {rendaFixaAtivos.map((asset, index) => (
                    <div key={`renda-fixa-${index}`} className="flex items-center gap-2">
                      <input
                        value={asset.nome}
                        onChange={(event) => updateFixedIncomeAsset(index, "nome", event.target.value)}
                        maxLength={80}
                        placeholder="Ex.: Tesouro Selic, CDB, LCI..."
                        className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        aria-label={`Nome do ativo de renda fixa ${index + 1}`}
                      />
                      <div className="relative w-28 shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={asset.percentual}
                          onChange={(event) => updateFixedIncomeAsset(index, "percentual", Number(event.target.value))}
                          className="w-full rounded-lg border border-slate-300 px-2 py-2 pr-7 text-right text-sm"
                          aria-label={`Percentual do ativo de renda fixa ${index + 1}`}
                        />
                        <span className="absolute right-2 top-2 text-sm text-slate-500">%</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFixedIncomeAsset(index)}
                        disabled={rendaFixaAtivos.length <= 1}
                        title="Remover ativo"
                        aria-label={`Remover ativo de renda fixa ${index + 1}`}
                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={addFixedIncomeAsset}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-900"
                  >
                    <Plus className="h-4 w-4" /> Adicionar ativo
                  </button>
                  <span className={`text-xs font-medium ${nearOneHundred(rendaFixaAtivos.reduce((sum, asset) => sum + asset.percentual, 0)) ? "text-emerald-700" : "text-amber-700"}`}>
                    Ativos: {formattedPercent(rendaFixaAtivos.reduce((sum, asset) => sum + asset.percentual, 0))}
                  </span>
                </div>
              </div>
              <div className="min-w-0 rounded-xl bg-slate-50 p-3">
                <h4 className="text-sm font-semibold text-slate-800">Distribuição da renda fixa</h4>
                <PieComposition
                  data={previewSegmentCharts[0].data}
                  emptyMessage="Adicione ativos para visualizar a distribuição."
                  compact
                />
                <ul className="space-y-2">
                  {previewSegmentCharts[0].data.map((item, index) => (
                    <li key={`${item.name}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2 text-slate-600">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="truncate">{item.name}</span>
                      </span>
                      <span className="shrink-0 whitespace-nowrap font-semibold tabular-nums text-slate-800">{formattedPercent(item.value)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </details>

          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900">Composição da renda variável</h3>
                <p className="mt-1 text-sm text-slate-500">A participação das categorias deve somar 100% da renda variável.</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${nearOneHundred(categoryTotal) ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
                Total: {formattedPercent(categoryTotal)}
              </span>
            </div>

            {groups.map((group) => {
              const assetTotal = group.ativos.reduce((sum, asset) => sum + asset.percentual, 0);
              const groupChartData = previewSegmentCharts.find((item) => item.key === group.key)?.data ?? [];
              return (
                <details key={group.key} className="group rounded-xl border border-slate-200 bg-white">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: group.color }} />
                      <span className="min-w-0">
                        <span className="block font-semibold text-slate-900">{group.label}</span>
                        <span className="block text-sm text-slate-500">
                          {formattedPercent((rendaVariavelPercentual * group.percentual) / 100)} da carteira
                        </span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {formattedPercent(group.percentual)} da variável
                      </span>
                      <ChevronDown className="h-5 w-5 text-slate-500 transition-transform group-open:rotate-180" />
                    </span>
                  </summary>
                  <div className="grid gap-5 border-t border-slate-100 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.8fr)]">
                    <div>
                      <div className="mb-4">
                        <label className="flex max-w-sm items-center justify-between gap-3 text-sm text-slate-600">
                          <span>Percentual da renda variável</span>
                          <span className="relative w-28 shrink-0">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={group.percentual}
                              onChange={(event) => updateGroupPercent(group.key, Number(event.target.value))}
                              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 pr-7 text-right text-sm"
                              aria-label={`Percentual de ${group.label} na renda variável`}
                            />
                            <span className="absolute right-2 top-1.5">%</span>
                          </span>
                        </label>
                      </div>
                      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                        <span>Ativo</span>
                        <span className="pr-10">Participação na categoria</span>
                      </div>
                      <div className="space-y-2">
                        {group.ativos.map((asset, index) => (
                          <div key={`${group.key}-${index}`} className="flex items-center gap-2">
                            <input
                              value={asset.ticker}
                              onChange={(event) => updateAsset(group.key, index, "ticker", event.target.value.toUpperCase())}
                              maxLength={20}
                              placeholder={group.key === "etfs" ? "Ex.: IVVB11" : group.key === "fiis" ? "Ex.: HGLG11" : "Ex.: ITUB4"}
                              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase"
                              aria-label={`Ticker do ativo ${index + 1} em ${group.label}`}
                            />
                            <div className="relative w-28 shrink-0">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={asset.percentual}
                                onChange={(event) => updateAsset(group.key, index, "percentual", Number(event.target.value))}
                                className="w-full rounded-lg border border-slate-300 px-2 py-2 pr-7 text-right text-sm"
                                aria-label={`Percentual do ativo ${index + 1} em ${group.label}`}
                              />
                              <span className="absolute right-2 top-2 text-sm text-slate-500">%</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAsset(group.key, index)}
                              disabled={group.ativos.length <= 1}
                              title="Remover ativo"
                              aria-label={`Remover ativo ${index + 1} de ${group.label}`}
                              className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => addAsset(group.key)}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-900"
                        >
                          <Plus className="h-4 w-4" /> Adicionar ativo
                        </button>
                        <span className={`text-xs font-medium ${nearOneHundred(assetTotal) ? "text-emerald-700" : "text-amber-700"}`}>
                          Ativos: {formattedPercent(assetTotal)}
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0 rounded-xl bg-slate-50 p-3">
                      <h4 className="text-sm font-semibold text-slate-800">Distribuição de {group.label}</h4>
                      <PieComposition data={groupChartData} emptyMessage="Adicione ativos para visualizar a distribuição." compact />
                      <ul className="space-y-2">
                        {groupChartData.map((item, index) => (
                          <li key={`${item.name}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                            <span className="flex min-w-0 items-center gap-2 text-slate-600">
                              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="truncate">{item.name}</span>
                            </span>
                            <span className="shrink-0 whitespace-nowrap font-semibold tabular-nums text-slate-800">{formattedPercent(item.value)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </details>
              );
            })}
          </section>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
          >
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Salvando..." : "Salvar estudo"}
          </button>
        </form>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Prévia da carteira</h2>
          <p className="mt-1 text-sm text-slate-500">A divisão geral mostra as classes no total; cada gráfico seguinte detalha apenas os ativos do segmento.</p>
        </div>
        <div className="grid gap-4">
          <article className="max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-slate-900">Divisão geral da carteira</h3>
            <p className="mt-1 text-xs text-slate-500">Renda fixa, ETFs internacionais, FIIs e ações.</p>
            <PieComposition data={previewCategoryData} emptyMessage="Ajuste os percentuais para totalizar 100%." compact />
            <ul className="space-y-2">
              {previewCategoryData.map((item) => (
                <li key={item.name} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-slate-600">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="shrink-0 font-semibold text-slate-800">{formattedPercent(item.value)}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Estudos salvos</h2>
            <p className="mt-1 text-sm text-slate-500">Cada estudo mantém sua própria composição de referência.</p>
          </div>
          {studies.length > 0 && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
              {studies.length} {studies.length === 1 ? "estudo" : "estudos"}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center rounded-2xl border border-slate-200 bg-white py-14">
            <LoaderCircle className="h-7 w-7 animate-spin text-slate-500" />
          </div>
        ) : studies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <ChartPie className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-3 font-semibold text-slate-700">Nenhum estudo salvo ainda</p>
            <p className="mt-1 text-sm text-slate-500">Monte sua primeira carteira de referência acima.</p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {studies.map((study) => {
              const categoryChartData = getStudyCategoryChartData(study);
              const segmentCharts = getStudySegmentCharts(study);
              return (
                <article key={study.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-slate-900">{study.nome}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Salvo em {formatDate(study.createdAt)} · Variável {formattedPercent(study.rendaVariavelPercentual)} · Fixa {formattedPercent(study.rendaFixaPercentual)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => confirmDeleteStudy(study.id, study.nome)}
                      disabled={deletingId === study.id}
                      aria-label={`Excluir estudo ${study.nome}`}
                      title="Excluir estudo"
                      className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    >
                      {deletingId === study.id
                        ? <LoaderCircle className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
                    {[
                      { key: "carteira", title: "Divisão geral da carteira", data: categoryChartData },
                      ...segmentCharts,
                    ].map(({ key, title, data }) => (
                      <section key={key} className="min-w-0 overflow-hidden rounded-xl border border-slate-100 p-3">
                        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
                        <PieComposition data={data} emptyMessage="Sem ativos neste segmento." compact />
                        <ul className="space-y-2 overflow-hidden">
                          {data.map((item, index) => (
                            <li key={`${item.name}-${index}`} className="flex min-w-0 items-center justify-between gap-2 text-sm">
                              <span className="flex min-w-0 items-center gap-2 text-slate-600">
                                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="truncate">{item.name}</span>
                              </span>
                              <span className="shrink-0 whitespace-nowrap font-semibold tabular-nums text-slate-800">{formattedPercent(item.value)}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
