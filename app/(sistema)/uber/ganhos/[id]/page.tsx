"use client";

import PageHeader from "@/components/PageHeader/PageHeader";
import { useEffect, useState } from "react";
import { ChevronLeft, Save } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface FormData {
    data: string;
    plataforma: string;
    valorBruto: string;
    horasTrabalhadas: string;
    kmRodados: string;
    observacao: string;
}

export default function EditarGanho() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const hoje = new Date();
    hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
    const dataAtual = hoje.toISOString().split("T")[0];

    const [loading, setLoading] = useState(false);
    const [loadingPage, setLoadingPage] = useState(true);

    const [formData, setFormData] = useState<FormData>({
        data: dataAtual,
        plataforma: "Uber",
        valorBruto: "",
        horasTrabalhadas: "",
        kmRodados: "",
        observacao: "",
    });

    const [errors, setErrors] = useState<Partial<FormData>>({});

    /* =========================================================
       CARREGAR POR ID (CORRIGIDO)
    ========================================================= */
    useEffect(() => {
        if (id) fetchGanho();
    }, [id]);

    async function fetchGanho() {
        try {
            setLoadingPage(true);

            const response = await fetch(`/api/uber/ganhos/${id}`);

            console.log("ID SENDO USADO:", id);

            console.log("STATUS:", response.status);

            const data = await response.json();

            console.log("RESPOSTA BRUTA DA API:", data);

            if (!response.ok) {
                console.log("ERRO DA API:", data);
                throw new Error(data?.message || "Erro ao carregar ganho");
            }

            if (!data?.ganho) {
                console.log("OBJETO GANHO NÃO EXISTE:", data);
                throw new Error("Ganho não encontrado");
            }

            const ganho = data.ganho;

            console.log("GANHO FINAL USADO NO FORM:", ganho);

            setFormData({
                data: ganho.data
                    ? new Date(ganho.data).toISOString().split("T")[0]
                    : dataAtual,

                plataforma: ganho.plataforma || "Uber",
                valorBruto: ganho.valorBruto?.toString() || "",
                horasTrabalhadas: ganho.horasTrabalhadas?.toString() || "",
                kmRodados: ganho.kmRodados?.toString() || "",
                observacao: ganho.observacao || "",
            });

        } catch (error) {
            console.error("ERRO NO FETCH:", error);
            toast.success("Ganho carregado com sucesso!");
            toast.error("Erro ao carregar ganho");
        } finally {
            setLoadingPage(false);
        }
    }

    /* ========================================================= */

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (errors[name as keyof FormData]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    /* ========================================================= */

    const validateForm = (): boolean => {
        const newErrors: Partial<FormData> = {};

        if (!formData.data) newErrors.data = "Data é obrigatória";
        if (!formData.plataforma) newErrors.plataforma = "Plataforma é obrigatória";

        if (!formData.valorBruto) {
            newErrors.valorBruto = "Valor bruto é obrigatório";
        } else if (parseFloat(formData.valorBruto) <= 0) {
            newErrors.valorBruto = "Valor bruto deve ser maior que 0";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /* ========================================================= */

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setLoading(true);

            const response = await fetch(`/api/uber/ganhos/${id}`, {
                method: "PUT",
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

            toast.success("Ganho atualizado com sucesso!");

            // 👇 mais seguro que setTimeout solto
            setTimeout(() => {
                router.push("/uber/ganhos");
            }, 2000);

        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar ganho");
        } finally {
            setLoading(false);
        }
    };

    /* ========================================================= */

    if (loadingPage) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <p className="text-slate-500">
                    Carregando ganho...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex items-center justify-between">

                <PageHeader
                    title="Editar Ganho"
                    description="Atualize o registro de ganho da sua sessão Uber"
                />

                <Link
                    href="/uber/ganhos"
                    className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow"
                >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Voltar
                </Link>

            </div>

            {/* FORMULÁRIO (MESMO LAYOUT DO NOVO) */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Informações do Ganho
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6">

                    <div className="space-y-6">

                        {/* DATA + PLATAFORMA */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Data <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="date"
                                    name="data"
                                    value={formData.data}
                                    onChange={handleChange}
                                    className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Plataforma <span className="text-red-500">*</span>
                                </label>

                                <select
                                    name="plataforma"
                                    value={formData.plataforma}
                                    onChange={handleChange}
                                    className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                                >
                                    <option value="Uber">Uber</option>
                                    <option value="99">99</option>
                                    <option value="Outros">Outros</option>
                                </select>
                            </div>
                        </div>

                        {/* VALOR */}
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
                                    className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm"
                                />
                            </div>
                        </div>

                        {/* HORAS + KM */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Horas Trabalhadas
                                </label>

                                <input
                                    type="number"
                                    name="horasTrabalhadas"
                                    value={formData.horasTrabalhadas}
                                    onChange={handleChange}
                                    className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    KM Rodados
                                </label>

                                <input
                                    type="number"
                                    name="kmRodados"
                                    value={formData.kmRodados}
                                    onChange={handleChange}
                                    className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                                />
                            </div>
                        </div>

                        {/* OBS */}
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

                    {/* BOTÕES */}
                    <div className="mt-8 flex gap-4 border-t border-slate-200 pt-6">

                        <Link
                            href="/uber/ganhos"
                            className="flex items-center gap-2 rounded-lg border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700"
                        >
                            Cancelar
                        </Link>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white"
                        >
                            <Save className="h-4 w-4" />
                            {loading ? "Atualizando..." : "Atualizar Ganho"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}