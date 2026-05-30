"use client";

import PageHeader from "@/components/PageHeader/PageHeader";
import { useState } from "react";
import { ChevronLeft, Save } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface FormData {
    data: string;
    plataforma: string;
    valorBruto: string;
    horasTrabalhadas: string;
    kmRodados: string;
    observacao: string;
}

export default function NovoGanho() {

    const hoje = new Date();
    hoje.setMinutes(
        hoje.getMinutes() - hoje.getTimezoneOffset()
    );

    const dataAtual = hoje
        .toISOString()
        .split("T")[0];

    const [formData, setFormData] = useState<FormData>({
        data: dataAtual,
        plataforma: "Uber",
        valorBruto: "",
        horasTrabalhadas: "",
        kmRodados: "",
        observacao: "",
    });

    const [errors, setErrors] = useState<Partial<FormData>>({});

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error for this field when user starts typing
        if (errors[name as keyof FormData]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<FormData> = {};

        if (!formData.data) {
            newErrors.data = "Data é obrigatória";
        }

        if (!formData.plataforma) {
            newErrors.plataforma = "Plataforma é obrigatória";
        }

        if (!formData.valorBruto) {
            newErrors.valorBruto = "Valor bruto é obrigatório";
        } else if (parseFloat(formData.valorBruto) <= 0) {
            newErrors.valorBruto = "Valor bruto deve ser maior que 0";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            const response = await fetch("/api/uber/ganhos", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    data: formData.data,
                    plataforma: formData.plataforma,
                    valorBruto: Number(formData.valorBruto),
                    horasTrabalhadas: Number(formData.horasTrabalhadas),
                    kmRodados: Number(formData.kmRodados),
                    observacao: formData.observacao,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            toast.success("Ganho registrado com sucesso!");

            setTimeout(() => {
                router.push("/uber/ganhos");
            }, 2000);

        } catch (error) {
            console.log(error);
            toast.error("Erro ao cadastrar ganho");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                {/* Lado esquerdo: título */}
                <PageHeader
                    title="Registrar Novo Ganho"
                    description="Adicione um novo registro de ganho à sua sessão Uber"
                />

                {/* Lado direito: ações */}
                <div className="flex items-center gap-2">
                    <Link
                        href="/uber/ganhos"
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Voltar
                    </Link>
                </div>
            </div>

            {/* Formulário */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Informações do Ganho
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-6">
                        {/* Primeira linha: Data e Plataforma */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Data */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Data <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="data"
                                    value={formData.data}
                                    onChange={handleChange}
                                    className={`mt-2 w-full rounded-lg border px-4 py-2 text-sm transition focus:outline-none ${errors.data
                                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                        : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                                        }`}
                                />
                                {errors.data && (
                                    <p className="mt-1 text-sm text-red-600">{errors.data}</p>
                                )}
                            </div>

                            {/* Plataforma */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Plataforma <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="plataforma"
                                    value={formData.plataforma}
                                    onChange={handleChange}
                                    className={`mt-2 w-full rounded-lg border px-4 py-2 text-sm transition focus:outline-none ${errors.plataforma
                                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                        : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                                        }`}
                                >
                                    <option value="">Selecione uma plataforma</option>
                                    <option value="Uber">Uber</option>
                                    <option value="99">99</option>
                                    <option value="Outros">Outros</option>
                                </select>
                                {errors.plataforma && (
                                    <p className="mt-1 text-sm text-red-600">{errors.plataforma}</p>
                                )}
                            </div>
                        </div>

                        {/* Segunda linha: Valor Bruto */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Valor Bruto <span className="text-red-500">*</span>
                            </label>
                            <div className="relative mt-2">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                    R$
                                </span>
                                <input
                                    type="number"
                                    name="valorBruto"
                                    value={formData.valorBruto}
                                    onChange={handleChange}
                                    placeholder="0,00"
                                    step="0.01"
                                    min="0"
                                    className={`w-full rounded-lg border pl-10 pr-4 py-2 text-sm transition focus:outline-none ${errors.valorBruto
                                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                        : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                                        }`}
                                />
                            </div>
                            {errors.valorBruto && (
                                <p className="mt-1 text-sm text-red-600">{errors.valorBruto}</p>
                            )}
                        </div>

                        {/* Terceira linha: Horas e KM */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Horas Trabalhadas */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Horas Trabalhadas
                                </label>
                                <div className="relative mt-2">
                                    <input
                                        type="number"
                                        name="horasTrabalhadas"
                                        value={formData.horasTrabalhadas}
                                        onChange={handleChange}
                                        placeholder="0,00"
                                        step="0.5"
                                        min="0"
                                        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                                        h
                                    </span>
                                </div>
                            </div>

                            {/* KM Rodados */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    KM Rodados
                                </label>
                                <div className="relative mt-2">
                                    <input
                                        type="number"
                                        name="kmRodados"
                                        value={formData.kmRodados}
                                        onChange={handleChange}
                                        placeholder="0"
                                        step="1"
                                        min="0"
                                        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                                        km
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Observação */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Observação
                            </label>
                            <textarea
                                name="observacao"
                                value={formData.observacao}
                                onChange={handleChange}
                                placeholder="Adicione qualquer observação sobre o ganho..."
                                rows={4}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Botões de ação */}
                    <div className="mt-8 flex gap-4 border-t border-slate-200 pt-6">
                        <Link
                            href="/uber/ganhos"
                            className="flex items-center gap-2 rounded-lg border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-green-700"
                        >
                            <Save className="h-4 w-4" />
                            Registrar Ganho
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
