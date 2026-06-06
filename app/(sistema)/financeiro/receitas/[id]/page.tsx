// app/(sistema)/financeiro/receitas/[id]/page.tsx

"use client";

import PageHeader from "@/components/PageHeader/PageHeader";
import { useEffect, useState } from "react";
import { ChevronLeft, Save } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
    useRouter,
    useParams,
} from "next/navigation";

interface FormData {
    data: string;
    categoria: string;
    valor: string;
    observacao: string;

    recorrente: boolean;
    dataFim: string;
}

export default function EditarReceita() {

    const hoje = new Date();
    hoje.setMinutes(
        hoje.getMinutes() - hoje.getTimezoneOffset()
    );

    const dataAtual = hoje
        .toISOString()
        .split("T")[0];

    const [formData, setFormData] = useState<FormData>({
        data: dataAtual,

        categoria: "RENDA_1",

        valor: "",

        observacao: "",

        recorrente: false,

        dataFim: "",
    });

    const [errors, setErrors] = useState<Partial<FormData>>({});

    const [loading, setLoading] =
        useState(true);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement |
            HTMLSelectElement |
            HTMLTextAreaElement
        >
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

        if (!formData.data) {
            newErrors.data = "Data é obrigatória";
        }

        if (!formData.categoria) {
            newErrors.categoria = "Categoria é obrigatória";
        }

        if (!formData.valor) {
            newErrors.valor = "Valor é obrigatório";
        } else if (Number(formData.valor) <= 0) {
            newErrors.valor = "Valor deve ser maior que zero";
        }

        if (
            formData.recorrente &&
            !formData.dataFim
        ) {
            newErrors.dataFim =
                "Informe até quando a receita será recorrente";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const router = useRouter();

    const params = useParams();

    const id = params.id as string;

    useEffect(() => {
        const carregarReceita = async () => {
            try {
                const response = await fetch(
                    `/api/financeiro/receitas/${id}`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message
                    );
                }

                setFormData({
                    data:
                        data.receita.data?.split(
                            "T"
                        )[0],

                    categoria:
                        data.receita.categoria,

                    valor: String(
                        data.receita.valor
                    ),

                    observacao:
                        data.receita.observacao ||
                        "",

                    recorrente:
                        data.receita.recorrente,

                    dataFim:
                        data.receita.dataFim
                            ? data.receita.dataFim.split(
                                "T"
                            )[0]
                            : "",
                });
            } catch (error) {
                console.error(error);

                toast.error(
                    "Erro ao carregar receita"
                );

                router.push(
                    "/financeiro/receitas"
                );
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            carregarReceita();
        }
    }, [id, router]);

    const handleSubmit = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            const response = await fetch(
                `/api/financeiro/receitas/${id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        data: formData.data,
                        categoria: formData.categoria,
                        valor: Number(formData.valor),
                        observacao:
                            formData.observacao,

                        recorrente:
                            formData.recorrente,

                        dataFim:
                            formData.recorrente
                                ? formData.dataFim
                                : null,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            toast.success(
                "Receita atualizada com sucesso!"
            );

            setTimeout(() => {
                router.push(
                    "/financeiro/receitas"
                );
            }, 1500);

        } catch (error) {
            console.error(error);

            toast.error(
                "Erro ao atualizar receita"
            );
        }
    };

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <PageHeader
                    title="Editar Receita"
                    description="Atualize as informações da receita"
                />

                <div className="flex items-center gap-2">
                    <Link
                        href="/financeiro/receitas"
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
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
                        Informações da Receita
                    </h2>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="p-6"
                >
                    <div className="space-y-6">

                        {/* Data e Categoria */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Data
                                    <span className="text-red-500"> *</span>
                                </label>

                                <input
                                    type="date"
                                    name="data"
                                    value={formData.data}
                                    onChange={handleChange}
                                    className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                                />

                                {errors.data && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.data}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Categoria
                                    <span className="text-red-500"> *</span>
                                </label>

                                <select
                                    name="categoria"
                                    value={formData.categoria}
                                    onChange={handleChange}
                                    className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                                >
                                    <option value="RENDA_1">
                                        Renda 1 (Câmara)
                                    </option>

                                    <option value="TICKET">
                                        Ticket Alimentação
                                    </option>

                                    <option value="RENDA_2">
                                        Renda 2 (Uber / 99)
                                    </option>

                                    <option value="DECIMO">
                                        13º Salário
                                    </option>

                                    <option value="FERIAS">
                                        Férias
                                    </option>

                                    <option value="RESGATE">
                                        Resgate de Investimentos
                                    </option>

                                    <option value="OUTROS">
                                        Outros
                                    </option>
                                </select>

                                {errors.categoria && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.categoria}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Valor */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Valor
                                <span className="text-red-500"> *</span>
                            </label>

                            <div className="relative mt-2">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                    R$
                                </span>

                                <input
                                    type="number"
                                    name="valor"
                                    value={formData.valor}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                    placeholder="0,00"
                                    className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm"
                                />
                            </div>

                            {errors.valor && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.valor}
                                </p>
                            )}
                        </div>

                        {/* Receita recorrente */}
                        <div className="rounded-xl border border-slate-200 p-4">

                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={formData.recorrente}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            recorrente:
                                                e.target.checked,
                                        }))
                                    }
                                />

                                <span className="font-medium text-slate-700">
                                    Receita recorrente
                                </span>
                            </label>

                            <p className="mt-2 text-sm text-slate-500">
                                Ao marcar esta opção, o sistema
                                criará projeções futuras até a
                                data informada.
                            </p>

                            {formData.recorrente && (
                                <div className="mt-4">

                                    <label className="block text-sm font-medium text-slate-700">
                                        Repetir até
                                    </label>

                                    <input
                                        type="date"
                                        name="dataFim"
                                        value={formData.dataFim}
                                        onChange={handleChange}
                                        className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                                    />

                                    {errors.dataFim && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.dataFim}
                                        </p>
                                    )}
                                </div>
                            )}
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
                                rows={4}
                                placeholder="Observações sobre esta receita..."
                                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                            />
                        </div>
                    </div>

                    {/* Botões */}
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

// export default NovoGanho;