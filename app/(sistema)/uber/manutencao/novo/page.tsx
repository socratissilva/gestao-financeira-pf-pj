"use client";

import PageHeader from "@/components/PageHeader/PageHeader";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateBR } from "@/utils/formatDate";
import toast from "react-hot-toast";

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

const REGRAS_MANUTENCAO: Record<
  string,
  { meses: number; km: number }
> = {
  "Troca de óleo": { meses: 6, km: 10000 },
  "Troca de pneus": { meses: 12, km: 40000 },
  "Alinhamento e balanceamento": {
    meses: 6,
    km: 10000,
  },
  Freios: { meses: 8, km: 20000 },
  Suspensão: { meses: 12, km: 30000 },
  "Ar-condicionado": { meses: 12, km: 15000 },
  Bateria: { meses: 24, km: 0 },
  Filtros: { meses: 6, km: 10000 },
  "Revisão geral": { meses: 12, km: 10000 },
  Outros: { meses: 6, km: 10000 },
};

type TipoManutencao =
  (typeof TIPOS_MANUTENCAO)[number];

/* ========================================================= */

export default function NovaManutencaoPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [formData, setFormData] = useState({
    data: "",
    tipo: "" as TipoManutencao | "",
    valor: "",
    km: "",
    observacoes: "",
  });

  /* =========================================================
     CALCULAR PREVISÃO AUTOMÁTICA
  ========================================================= */

  function calcularPrevisao(
    tipo: string,
    dataBase: string,
    kmBase: number
  ) {
    if (!tipo) {
      return {
        proximaData: "",
        proximaKm: 0,
      };
    }

    const regra = REGRAS_MANUTENCAO[tipo];

    let proximaData = "";

    if (dataBase) {
      const d = new Date(dataBase);

      d.setMonth(
        d.getMonth() + regra.meses
      );

      proximaData = d
        .toISOString()
        .split("T")[0];
    }

    const proximaKm = kmBase
      ? kmBase + regra.km
      : 0;

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

  /* =========================================================
     SALVAR
  ========================================================= */

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (
      !formData.data ||
      !formData.tipo ||
      !formData.valor ||
      !formData.km
    ) {
      toast.error(
        "Preencha os campos obrigatórios."
      );
      return;
    }

    try {
      setLoading(true);

      const payload = {
        data: new Date(
          formData.data
        ).toISOString(),

        tipo: formData.tipo,

        valor: Number(formData.valor),

        km: Number(formData.km),

        // PREVISÕES AUTOMÁTICAS
        proximaData:
          previsao.proximaData || null,

        proximaKm:
          previsao.proximaKm || null,

        observacoes:
          formData.observacoes,

        // NOVA LÓGICA
        concluida: false,
      };

      const response = await fetch(
        "/api/uber/manutencao",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data?.error ||
          "Erro ao salvar manutenção"
        );
      }

      toast.success(
        "Manutenção registrada com sucesso!"
      );

      setTimeout(() => {
        router.push("/uber/manutencao");
      }, 1500);

      setFormData({
        data: "",
        tipo: "",
        valor: "",
        km: "",
        observacoes: "",
      });
    } catch (error: any) {
      console.error(error);

      toast.error(
        error.message ||
        "Erro ao registrar manutenção."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ========================================================= */

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Registrar Nova Manutenção"
          description="Adicione um novo registro de manutenção à sua sessão Uber"
        />

        <div className="flex items-center gap-2">
          <Link
            href="/uber/manutencao"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
      </div>

      {/* CARD */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Informações da Manutenção
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-6"
        >
          {/* DATA + TIPO */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Data da manutenção
              </label>

              <input
                type="date"
                value={formData.data}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    data: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2"
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
                    tipo:
                      e.target
                        .value as TipoManutencao,
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2"
              >
                <option value="">
                  Tipo de serviço
                </option>

                {TIPOS_MANUTENCAO.map((t) => (
                  <option
                    key={t}
                    value={t}
                  >
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* VALOR + KM */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Valor da manutenção
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  R$
                </span>

                <input
                  type="number"
                  placeholder="0,00"
                  value={formData.valor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      valor: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2"
                />
              </div>
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
                  setFormData({
                    ...formData,
                    km: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2"
              />
            </div>
          </div>

          {/* PREVISÕES */}
          {(previsao.proximaData ||
            previsao.proximaKm > 0) && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Próxima manutenção por
                    data
                  </label>

                  <input
                    disabled
                    value={formatDateBR(
                      previsao.proximaData
                    )}
                    placeholder="Próxima data"
                    className="w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-2"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Próxima manutenção por KM
                  </label>

                  <input
                    disabled
                    value={
                      previsao.proximaKm
                        ? `${previsao.proximaKm.toLocaleString(
                          "pt-BR"
                        )} km`
                        : ""
                    }
                    placeholder="Próxima KM"
                    className="w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-2"
                  />
                </div>
              </div>
            )}

          {/* ALERTA VISUAL */}
          {(previsao.proximaData ||
            previsao.proximaKm > 0) && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <h3 className="font-semibold text-blue-900">
                  📌 Previsão automática
                  gerada
                </h3>

                <div className="mt-2 space-y-1 text-sm text-blue-800">
                  {previsao.proximaData && (
                    <p>
                      📅 Próxima manutenção
                      prevista para{" "}
                      <strong>
                        {formatDateBR(
                          previsao.proximaData
                        )}
                      </strong>
                    </p>
                  )}

                  {previsao.proximaKm >
                    0 && (
                      <p>
                        🔧 Próxima manutenção
                        prevista em{" "}
                        <strong>
                          {previsao.proximaKm.toLocaleString(
                            "pt-BR"
                          )}{" "}
                          km
                        </strong>
                      </p>
                    )}
                </div>
              </div>
            )}

          {/* OBSERVAÇÕES */}
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
                  observacoes:
                    e.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-2"
              placeholder="Observações"
            />
          </div>

          {/* FOOTER */}
          <div className="flex gap-4 border-t border-slate-200 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Salvando..."
                : "Salvar Manutenção"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}