// app/(sistema)/financeiro/receitas-previstas/[id]/page.tsx
"use client";

import PageHeader from "@/components/PageHeader/PageHeader";
import { useEffect, useState } from "react";
import { ChevronLeft, Save } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter, useParams } from "next/navigation";
import { CATEGORIAS } from "@/constants/categorias";

interface FormData {
    mesAno: string;
    categoria: string;
    valor: string;
    observacao: string;
    recorrente: boolean;
    mesAnoFim: string;
}

export default function EditarReceita() {
    const { id } = useParams();
    const router = useRouter();

    const [formData, setFormData] = useState<FormData | null>(null);
    const [errors, setErrors] = useState<Partial<FormData>>({});

    /* =========================
       CARREGAR DADOS
    ========================= */
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(
                    `/api/financeiro/receitas-previstas/${id}`
                );

                const data = await res.json();

                setFormData({
                    mesAno: data.receita.mesAno?.slice(0, 7),
                    categoria: data.receita.categoria,
                    valor: String(data.receita.valor),
                    observacao: data.receita.observacao || "",
                    recorrente: data.receita.recorrente,
                    mesAnoFim: data.receita.mesAnoFim
                        ? data.receita.mesAnoFim.slice(0, 7)
                        : "",
                });
            } catch {
                toast.error("Erro ao carregar receita");
            }
        };

        fetchData();
    }, [id]);

    /* =========================
       HANDLER
    ========================= */
    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value, type } = e.target;

        setFormData((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                [name]:
                    type === "checkbox"
                        ? (e.target as HTMLInputElement).checked
                        : value,
            };
        });
    };

    /* =========================
       SALVAR
    ========================= */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await fetch(
                `/api/financeiro/receitas-previstas/${id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        ...formData,
                        valor: Number(formData?.valor),
                        mesAnoFim: formData?.recorrente
                            ? formData.mesAnoFim
                            : null,
                    }),
                }
            );

            if (!res.ok) throw new Error();

            toast.success("Receita atualizada com sucesso!");

            router.push("/financeiro/receitas-previstas");
        } catch {
            toast.error("Erro ao atualizar receita");
        }
    };

    if (!formData) return <div>Carregando...</div>;

    return (
        <div className="space-y-6">

            {/* HEADER (MANTIDO IGUAL) */}
            <div className="flex items-start justify-between gap-4">
                <PageHeader
                    title="Editar Receita"
                    description="Altere os dados da receita provisionada"
                />

                <Link
                    href="/financeiro/receitas-previstas"
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Voltar
                </Link>
            </div>

            {/* FORM (MANTIDO LAYOUT ORIGINAL) */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Informações da Receita
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6">

                    <div className="space-y-6">

                        {/* MÊS/ANO + CATEGORIA (mantido layout 2 colunas) */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                            {/* MÊS/ANO */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Mês / Ano *
                                </label>

                                <input
                                    type="month"
                                    name="mesAno"
                                    value={formData.mesAno}
                                    onChange={handleChange}
                                    className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                                />

                                {errors.mesAno && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.mesAno}
                                    </p>
                                )}
                            </div>

                            {/* CATEGORIA */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Categoria *
                                </label>

                                <select
                                    name="categoria"
                                    value={formData.categoria}
                                    onChange={handleChange}
                                    className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                                >
                                    <option value="" disabled>
                                        Selecione uma categoria
                                    </option>

                                    {CATEGORIAS.map((cat) => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* VALOR */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Valor *
                            </label>

                            <input
                                type="number"
                                name="valor"
                                value={formData.valor}
                                onChange={handleChange}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                            />

                            {errors.valor && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.valor}
                                </p>
                            )}
                        </div>

                        {/* RECORRENTE */}
                        <div className="rounded-xl border border-slate-200 p-4">

                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={formData.recorrente}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            recorrente: e.target.checked,
                                        }))
                                    }
                                />

                                <span className="font-medium text-slate-700">
                                    Receita recorrente
                                </span>
                            </label>

                            <p className="mt-2 text-sm text-slate-500">
                                A recorrência será aplicada mês a mês.
                            </p>

                            {/* ✅ AGORA MÊS/ANO FINAL */}
                            {formData.recorrente && (
                                <div className="mt-4">

                                    <label className="block text-sm font-medium text-slate-700">
                                        Repetir até (Mês / Ano)
                                    </label>

                                    <input
                                        type="month"
                                        name="mesAnoFim"
                                        value={formData.mesAnoFim}
                                        onChange={handleChange}
                                        className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                                    />

                                    {errors.mesAnoFim && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.mesAnoFim}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* OBSERVAÇÃO */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Descrição
                            </label>

                            <textarea
                                name="observacao"
                                value={formData.observacao}
                                onChange={handleChange}
                                rows={4}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                            />
                        </div>
                    </div>

                    {/* BOTÕES (MANTIDO) */}
                    <div className="mt-8 flex gap-4 border-t border-slate-200 pt-6">

                        <Link
                            href="/financeiro/receitas"
                            className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancelar
                        </Link>

                        <button
                            type="submit"
                            className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700"
                        >
                            <Save className="h-4 w-4" />
                            Atualizar Receita
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}