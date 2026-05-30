"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import PageHeader from "@/components/PageHeader/PageHeader";
import { ChevronLeft } from "lucide-react";

import toast from "react-hot-toast";
import Link from "next/link";

export default function EditarAbastecimentoPage() {
  const router = useRouter();

  const params = useParams();

  const id = params.id as string;

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    data: "",
    litros: "",
    km: "",
    valor: "",
  });

  useEffect(() => {
    if (id) {
      fetchAbastecimento();
    }
  }, [id]);

  async function fetchAbastecimento() {
    if (!id) return;

    try {
      setLoading(true);

      const response = await fetch(`/api/uber/combustivel/${id}`);

      const data = await response.json();

      console.log("DEBUG API:", data); // 👈 importante

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Erro ao buscar abastecimento"
        );
      }

      setFormData({
        data: data.abastecimento?.data
          ? data.abastecimento.data.split("T")[0]
          : "",

        litros: String(data.abastecimento?.litros ?? ""),

        km: String(data.abastecimento?.km ?? ""),

        valor: String(data.abastecimento?.valor ?? ""),
      });
    } catch (error: any) {
      console.error(error);

      toast.error(
        error.message || "Erro ao carregar abastecimento"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !formData.data ||
      !formData.litros ||
      !formData.km ||
      !formData.valor
    ) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        data: new Date(
          formData.data
        ).toISOString(),

        litros: Number(formData.litros),

        valor: Number(formData.valor),

        km: Number(formData.km),

        preco: (
          Number(formData.valor) /
          Number(formData.litros)
        ).toFixed(2),

        consumo: (
          Number(formData.km) /
          Number(formData.litros)
        ).toFixed(1),
      };

      const response = await fetch(`/api/uber/combustivel/${id}`, {
        method: "PUT",

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
          data.message ||
          "Erro ao atualizar abastecimento"
        );
      }

      toast.success(
        "Abastecimento atualizado com sucesso!"
      );

      setTimeout(() => {
        router.push("/uber/combustivel");
      }, 2000);
    } catch (error: any) {
      console.error(error);

      toast.error(
        error.message ||
        "Erro ao atualizar abastecimento"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <PageHeader
          title="Editar Abastecimento"
          description="Atualize as informações do abastecimento"
        />

        <Link
          href="/uber/combustivel"
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      {/* CARD */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Informações do abastecimento
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2"
        >
          {/* DATA */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Data
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
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2"
            />
          </div>

          {/* LITROS */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Litros
            </label>

            <input
              type="number"
              step="0.1"
              value={formData.litros}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  litros: e.target.value,
                })
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2"
            />
          </div>

          {/* KM */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              KM Rodado
            </label>

            <input
              type="number"
              value={formData.km}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  km: e.target.value,
                })
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2"
            />
          </div>

          {/* VALOR */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Valor Total
            </label>

            <input
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  valor: e.target.value,
                })
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2"
            />
          </div>

          {/* RESUMO */}
          {formData.litros &&
            formData.valor && (
              <div className="md:col-span-2">
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-slate-500">
                        Preço por litro
                      </p>

                      <p className="text-xl font-bold text-slate-900">
                        R${" "}
                        {(
                          Number(formData.valor) /
                          Number(formData.litros)
                        ).toFixed(2)}
                      </p>
                    </div>

                    {formData.km && (
                      <div>
                        <p className="text-sm text-slate-500">
                          Consumo médio
                        </p>

                        <p className="text-xl font-bold text-slate-900">
                          {(
                            Number(formData.km) /
                            Number(formData.litros)
                          ).toFixed(1)}{" "}
                          km/L
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          {/* FOOTER */}
          <div className="flex gap-4 border-t border-slate-200 pt-6 md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-orange-600 px-6 py-2 text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {loading
                ? "Salvando..."
                : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}