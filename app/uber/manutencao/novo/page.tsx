"use client";

import PageHeader from "@/components/PageHeader/PageHeader";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/* ========================================================= */

const TIPOS_MANUTENCAO = [
  "Troca de óleo",
  "Troca de pneus",
  "Alinhamento e balanceamento",
  "Freios",
  "Suspensão",
  "Ar-condicionado",
  "Bateria",
  "Filtros",
  "Revisão geral",
  "Outros",
] as const;

const REGRAS_MANUTENCAO: Record<string, { meses: number; km: number }> = {
  "Troca de óleo": { meses: 6, km: 10000 },
  "Troca de pneus": { meses: 12, km: 40000 },
  "Alinhamento e balanceamento": { meses: 6, km: 10000 },
  "Freios": { meses: 8, km: 20000 },
  "Suspensão": { meses: 12, km: 30000 },
  "Ar-condicionado": { meses: 12, km: 15000 },
  "Bateria": { meses: 24, km: 0 },
  "Filtros": { meses: 6, km: 10000 },
  "Revisão geral": { meses: 12, km: 10000 },
  "Outros": { meses: 6, km: 10000 },
};

type TipoManutencao = typeof TIPOS_MANUTENCAO[number];
type StatusManutencao = "Concluída" | "Pendente" | "Agendada";

/* ========================================================= */

export default function NovaManutencaoPage() {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    data: "",
    tipo: "" as TipoManutencao | "",
    valor: "",
    km: "",
    status: "Concluída" as StatusManutencao,
    observacoes: "",
  });

  /* ========================================================= */

  function calcularPrevisao(tipo: string, dataBase: string, kmBase: number) {
    if (!tipo) return { proximaData: "", proximaKm: 0 };

    const regra = REGRAS_MANUTENCAO[tipo];

    let proximaData = "";
    if (dataBase) {
      const d = new Date(dataBase);
      d.setMonth(d.getMonth() + regra.meses);
      proximaData = d.toISOString().split("T")[0];
    }

    const proximaKm = kmBase ? kmBase + regra.km : 0;

    return {
      proximaData,
      proximaKm,
    };
  }

  const previsao = calcularPrevisao(
    formData.tipo,
    formData.data,
    Number(formData.km || 0)
  );

  /* ========================================================= */

 async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  if (!formData.data || !formData.tipo || !formData.valor || !formData.km) {
    alert("Preencha os campos obrigatórios.");
    return;
  }

  try {
    setLoading(true);

    const payload = {
      data: new Date(formData.data).toISOString(),
      tipo: formData.tipo,
      valor: Number(formData.valor),
      km: Number(formData.km),
      status: formData.status,

      proximaData: previsao.proximaData || null,
      proximaKm: previsao.proximaKm || null,

      observacoes: formData.observacoes,
    };

    const response = await fetch("/api/uber/manutencao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log("RESPOSTA API:", data); // 👈 ESSENCIAL PRA DEBUG

    if (!response.ok || !data.success) {
      throw new Error(data?.error || "Erro ao salvar manutenção");
    }

    alert("Manutenção registrada com sucesso!");

    setFormData({
      data: "",
      tipo: "",
      valor: "",
      km: "",
      status: "Concluída",
      observacoes: "",
    });
  } catch (error: any) {
    console.error(error);
    alert(error.message || "Erro ao registrar manutenção.");
  } finally {
    setLoading(false);
  }
}

  /* ========================================================= */

  return (
  <div className="space-y-6">

    {/* HEADER */}
    <div className="flex items-center gap-4">
      <Link
        href="/uber/manutencao"
        className="flex items-center justify-center rounded-lg border border-slate-300 p-2 transition hover:bg-slate-50"
      >
        <ArrowLeft className="h-5 w-5 text-slate-600" />
      </Link>

      <PageHeader
        title="Nova Manutenção"
        description="Registre uma nova manutenção do veículo"
      />
    </div>

    {/* CARD */}
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Informações da Manutenção
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">

        {/* DATA + TIPO */}
        <div className="grid md:grid-cols-2 gap-6">

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Data da manutenção
            </label>

            <input
              type="date"
              value={formData.data}
              onChange={(e) =>
                setFormData({ ...formData, data: e.target.value })
              }
              className="w-full border border-slate-300 rounded-lg px-4 py-2"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Tipo de serviço
            </label>

            <select
              value={formData.tipo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tipo: e.target.value as TipoManutencao,
                })
              }
              className="w-full border border-slate-300 rounded-lg px-4 py-2"
            >
              <option value="">Tipo de serviço</option>

              {TIPOS_MANUTENCAO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* VALOR + KM */}
        <div className="grid md:grid-cols-2 gap-6">

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Valor da manutenção
            </label>

            <input
              type="number"
              placeholder="Valor"
              value={formData.valor}
              onChange={(e) =>
                setFormData({ ...formData, valor: e.target.value })
              }
              className="w-full border border-slate-300 rounded-lg px-4 py-2"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              KM atual do veículo
            </label>

            <input
              type="number"
              placeholder="KM atual"
              value={formData.km}
              onChange={(e) =>
                setFormData({ ...formData, km: e.target.value })
              }
              className="w-full border border-slate-300 rounded-lg px-4 py-2"
            />
          </div>

        </div>

        {/* PREVISÕES (DINÂMICAS) */}
        {(previsao.proximaData || previsao.proximaKm > 0) && (
          <div className="grid md:grid-cols-2 gap-6">

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Próxima manutenção por data
              </label>

              <input
                disabled
                value={previsao.proximaData}
                placeholder="Próxima data"
                className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-slate-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Próxima manutenção por KM
              </label>

              <input
                disabled
                value={previsao.proximaKm ? `${previsao.proximaKm} km` : ""}
                placeholder="Próxima KM"
                className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-slate-100"
              />
            </div>

          </div>
        )}

        {/* STATUS */}
        <div className="space-y-2">

          <label className="text-sm font-medium text-slate-700">
            Status da manutenção
          </label>

          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as StatusManutencao,
              })
            }
            className="w-full border border-slate-300 rounded-lg px-4 py-2"
          >
            <option value="Concluída">Concluída</option>
            <option value="Pendente">Pendente</option>
            <option value="Agendada">Agendada</option>
          </select>

        </div>

        {/* OBS */}
        <div className="space-y-2">

          <label className="text-sm font-medium text-slate-700">
            Observações
          </label>

          <textarea
            rows={4}
            value={formData.observacoes}
            onChange={(e) =>
              setFormData({
                ...formData,
                observacoes: e.target.value,
              })
            }
            className="w-full border border-slate-300 rounded-lg px-4 py-2"
            placeholder="Observações"
          />

        </div>

        {/* FOOTER */}
        <div className="flex gap-4 border-t border-slate-200 pt-6">

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            {loading ? "Salvando..." : "Salvar Manutenção"}
          </button>

        </div>

      </form>
    </div>
  </div>
);
}