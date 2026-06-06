//app/(sistema)/financeiro/receitas/novo/page.tsx
"use client";

import PageHeader from "@/components/PageHeader/PageHeader";
import { useState } from "react";
import { ChevronLeft, Save } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface FormData {
    mesAno: string;
    categoria: string;
    valor: string;
    observacao: string;
    recorrente: boolean;
    mesAnoFim: string; // ✅ ALTERADO (era data)
}

export default function NovoGanho() {
    const hoje = new Date();

    const mesAtual = String(hoje.getMonth() + 1).padStart(2, "0");
    const anoAtual = hoje.getFullYear().toString();

    const [formData, setFormData] = useState<FormData>({
        mesAno: `${mesAtual}-${anoAtual}`,
        categoria: "RENDA_1",
        valor: "",
        observacao: "",
        recorrente: false,
        mesAnoFim: "",
    });

    const [errors, setErrors] = useState<Partial<FormData>>({});
    const router = useRouter();

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? (e.target as HTMLInputElement).checked
                    : value,
        }));

        if (errors[name as keyof FormData]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<FormData> = {};

        if (!formData.mesAno) {
            newErrors.mesAno = "Mês/Ano é obrigatório";
        }

        if (!formData.categoria) {
            newErrors.categoria = "Categoria é obrigatória";
        }

        if (!formData.valor) {
            newErrors.valor = "Valor é obrigatório";
        } else if (Number(formData.valor) <= 0) {
            newErrors.valor = "Valor deve ser maior que zero";
        }

        // ✅ recorrência agora é mês/ano também
        if (formData.recorrente && !formData.mesAnoFim) {
            newErrors.mesAnoFim = "Informe o mês/ano final da recorrência";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            const response = await fetch("/api/financeiro/receitas", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    mesAno: formData.mesAno,
                    categoria: formData.categoria,
                    valor: Number(formData.valor),
                    observacao: formData.observacao,

                    recorrente: formData.recorrente,

                    // ✅ agora também mês/ano
                    mesAnoFim: formData.recorrente ? formData.mesAnoFim : null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            toast.success("Receita cadastrada com sucesso!");

            setTimeout(() => {
                router.push("/financeiro/receitas");
            }, 1500);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao cadastrar receita");
        }
    };

    return (
        <div className="space-y-6">

            {/* HEADER (MANTIDO IGUAL) */}
            <div className="flex items-start justify-between gap-4">
                <PageHeader
                    title="Nova Receita"
                    description="Cadastre receitas reais ou recorrentes do seu planejamento financeiro"
                />

                <Link
                    href="/financeiro/receitas"
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
                                    <option value="RENDA_1">Renda 1</option>
                                    <option value="TICKET">Ticket Alimentação</option>
                                    <option value="RENDA_2">Renda 2</option>
                                    <option value="DECIMO">13º Salário</option>
                                    <option value="FERIAS">Férias</option>
                                    <option value="RESGATE">Resgate</option>
                                    <option value="OUTROS">Outros</option>
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
                                Observação
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
                            Salvar Receita
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}