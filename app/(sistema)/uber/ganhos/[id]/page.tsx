"use client";

import PageHeader from "@/components/PageHeader/PageHeader";
import { useEffect, useState } from "react";
import { ChevronLeft, Save } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface FormData {
    mesAno: string;
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
    const mesAtual = String(hoje.getMonth() + 1).padStart(2, "0");
    const anoAtual = hoje.getFullYear().toString();

    const [loading, setLoading] = useState(false);
    const [loadingPage, setLoadingPage] = useState(true);

    const [formData, setFormData] = useState<FormData>({
        mesAno: `${mesAtual}-${anoAtual}`,
        plataforma: "Uber",
        valorBruto: "",
        horasTrabalhadas: "",
        kmRodados: "",
        observacao: "",
    });

    const [errors, setErrors] = useState<Partial<FormData>>({});

    /* =========================================================
       CARREGAR POR ID
    ========================================================= */
    useEffect(() => {
        if (id) fetchGanho();
    }, [id]);

    async function fetchGanho() {
        try {
            setLoadingPage(true);

            const response = await fetch(`/api/uber/ganhos/${id}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || "Erro ao carregar ganho");
            }

            const ganho = data.ganho;

            const dataObj = new Date(ganho.data);
            const mesAno = `${String(dataObj.getMonth() + 1).padStart(2, "0")}-${dataObj.getFullYear()}`;

            setFormData({
                mesAno,
                plataforma: ganho.plataforma || "Uber",
                valorBruto: ganho.valorBruto?.toString() || "",
                horasTrabalhadas: ganho.horasTrabalhadas?.toString() || "",
                kmRodados: ganho.kmRodados?.toString() || "",
                observacao: ganho.observacao || "",
            });

        } catch (error) {
            console.error(error);
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

        if (!formData.mesAno) newErrors.mesAno = "Mês/Ano é obrigatório";
        if (!formData.plataforma) newErrors.plataforma = "Plataforma é obrigatória";

        if (!formData.valorBruto) {
            newErrors.valorBruto = "Valor bruto é obrigatório";
        } else if (parseFloat(formData.valorBruto) <= 0) {
            newErrors.valorBruto = "Valor deve ser maior que 0";
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
                    mesAno: formData.mesAno,
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

            setTimeout(() => {
                router.push("/uber/ganhos");
            }, 1500);

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
                <p className="text-slate-500">Carregando ganho...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* HEADER (MANTIDO) */}
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Editar Ganho"
                    description="Atualize o registro do ganho"
                />

                <Link
                    href="/uber/ganhos"
                    className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Voltar
                </Link>
            </div>

            {/* FORM (MESMO LAYOUT) */}
            <div className="rounded-xl border bg-white shadow-sm">

                <div className="border-b px-6 py-4">
                    <h2 className="text-lg font-semibold">
                        Informações do Ganho
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* MÊS/ANO + PLATAFORMA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div>
                            <label className="text-sm font-medium">
                                Mês / Ano *
                            </label>

                            <input
                                type="month"
                                name="mesAno"
                                value={formData.mesAno}
                                onChange={handleChange}
                                className="mt-2 w-full border rounded-lg px-4 py-2"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">
                                Plataforma *
                            </label>

                            <select
                                name="plataforma"
                                value={formData.plataforma}
                                onChange={handleChange}
                                className="mt-2 w-full border rounded-lg px-4 py-2"
                            >
                                <option value="Uber">Uber</option>
                                <option value="99">99</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>
                    </div>

                    {/* VALOR */}
                    <div>
                        <label className="text-sm font-medium">
                            Valor Bruto *
                        </label>

                        <input
                            type="number"
                            name="valorBruto"
                            value={formData.valorBruto}
                            onChange={handleChange}
                            className="mt-2 w-full border rounded-lg px-4 py-2"
                        />
                    </div>

                    {/* HORAS + KM */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <input
                            type="number"
                            name="horasTrabalhadas"
                            placeholder="Horas"
                            value={formData.horasTrabalhadas}
                            onChange={handleChange}
                            className="border rounded-lg px-4 py-2"
                        />

                        <input
                            type="number"
                            name="kmRodados"
                            placeholder="KM"
                            value={formData.kmRodados}
                            onChange={handleChange}
                            className="border rounded-lg px-4 py-2"
                        />
                    </div>

                    {/* OBS */}
                    <textarea
                        name="observacao"
                        value={formData.observacao}
                        onChange={handleChange}
                        rows={4}
                        className="w-full border rounded-lg px-4 py-2"
                    />

                    {/* BOTÕES */}
                    <div className="flex gap-4 border-t pt-6">

                        <Link
                            href="/uber/ganhos"
                            className="px-6 py-2 border rounded-lg"
                        >
                            Cancelar
                        </Link>

                        <button
                            type="submit"
                            className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg"
                        >
                            <Save className="h-4 w-4" />
                            Salvar
                        </button>

                    </div>

                </form>
            </div>
        </div>
    );
}