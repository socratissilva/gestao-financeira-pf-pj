//app/(sistema)/financeiro/despesas-previstas/[id]/page.tsx
"use client";

import PageHeader from "@/components/PageHeader/PageHeader";
import { useState } from "react";
import { ChevronLeft, Save } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { CATEGORIAS_DESPESA }
    from "@/constants/categorias-despesas";


interface FormData {
    mesAno: string;
    categoria: string;
    valor: string;

    dataVencimento: string;

    formaPagamento: string;
    cartaoId: string;

    observacao: string;

    recorrente: boolean;
    mesAnoFim: string;

    // NOVOS CAMPOS
    valorPago: string;
    dataPagamento: string;
}

interface Cartao {
    _id: string;
    nome: string;
    vencimentoDia: number;
    limite?: number | null;
}

export default function EditarDespesaPage() {
    const params = useParams();

    const id = params.id as string;
    const hoje = new Date();

    const mesAtual = String(hoje.getMonth() + 1).padStart(2, "0");
    const anoAtual = hoje.getFullYear().toString();

    const [formData, setFormData] = useState<FormData>({
        mesAno: `${anoAtual}-${mesAtual}`,
        categoria: "MORADIA",
        valor: "",
        dataVencimento: "",
        formaPagamento: "PIX",
        cartaoId: "",
        observacao: "",
        recorrente: false,
        mesAnoFim: "",

        // NOVOS
        valorPago: "",
        dataPagamento: "",
    });

    const [errors, setErrors] = useState<Partial<FormData>>({});
    const router = useRouter();

    const [cartoes, setCartoes] = useState<Cartao[]>([]);
    const [loadingCartoes, setLoadingCartoes] = useState(false);

    async function carregarCartoes() {
        try {
            setLoadingCartoes(true);

            const response = await fetch(
                "/api/financeiro/cartoes"
            );

            if (!response.ok) {
                throw new Error();
            }

            const data = await response.json();

            setCartoes(data);
        } catch (error) {
            console.error(error);

            toast.error(
                "Erro ao carregar cartões."
            );
        } finally {
            setLoadingCartoes(false);
        }
    }

    async function carregarDespesa() {
        try {
            const response = await fetch(
                `/api/financeiro/despesas-previstas/${id}`
            );

            const data = await response.json();

            const despesa = data.despesa;

            setFormData({
                mesAno: despesa.mesAno
                    ? despesa.mesAno.slice(0, 7)
                    : "",

                categoria: despesa.categoria || "",

                valor: String(despesa.valor || ""),

                dataVencimento: despesa.dataVencimento
                    ? despesa.dataVencimento.slice(0, 10)
                    : "",

                formaPagamento: despesa.formaPagamento || "PIX",

                cartaoId: despesa.cartaoId || "",

                observacao: despesa.observacao || "",

                recorrente: despesa.recorrente || false,

                mesAnoFim: despesa.mesAnoFim
                    ? despesa.mesAnoFim.slice(0, 7)
                    : "",

                // ✅ NOVOS CAMPOS
                valorPago: despesa.valorPago
                    ? String(despesa.valorPago)
                    : "",

                dataPagamento: despesa.dataPagamento
                    ? despesa.dataPagamento.slice(0, 10)
                    : "",
            });
        } catch (error) {
            console.error(error);

            toast.error("Erro ao carregar despesa.");
        }
    }

    useEffect(() => {
        if (id) {
            carregarDespesa();
        }

        carregarCartoes();
    }, [id]);

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
            const response = await fetch(
                `/api/financeiro/despesas-previstas/${id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        mesAno: formData.mesAno,

                        categoria: formData.categoria,

                        valor: Number(formData.valor),

                        dataVencimento: formData.dataVencimento,

                        formaPagamento: formData.formaPagamento,

                        cartaoId:
                            formData.formaPagamento === "CREDITO"
                                ? formData.cartaoId
                                : null,

                        observacao: formData.observacao,

                        recorrente: formData.recorrente,

                        mesAnoFim:
                            formData.recorrente
                                ? formData.mesAnoFim
                                : null,

                        // NOVOS CAMPOS
                        valorPago:
                            formData.valorPago === ""
                                ? null
                                : Number(formData.valorPago),

                        dataPagamento:
                            formData.dataPagamento || null,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            toast.success(
                "Despesa atualizada com sucesso!"
            );

            setTimeout(() => {
                router.push("/financeiro/despesas-previstas");
            }, 1500);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar despesa");
        }
    };

    const cartaoSelecionado = cartoes.find(
        (cartao) => cartao._id === formData.cartaoId
    );

    useEffect(() => {
        if (
            formData.formaPagamento !== "CREDITO" ||
            !cartaoSelecionado
        ) {
            return;
        }

        const hoje = new Date();

        let ano = hoje.getFullYear();
        let mes = hoje.getMonth();

        if (hoje.getDate() > cartaoSelecionado.vencimentoDia) {
            mes += 1;

            if (mes > 11) {
                mes = 0;
                ano += 1;
            }
        }

        const dataVencimento = new Date(
            ano,
            mes,
            cartaoSelecionado.vencimentoDia
        );

        const dataFormatada =
            dataVencimento.toISOString().split("T")[0];

        setFormData((prev) => ({
            ...prev,
            dataVencimento: dataFormatada,
        }));
    }, [
        formData.formaPagamento,
        formData.cartaoId,
        cartaoSelecionado,
    ]);

    const valorPago = Number(formData.valorPago || 0);

    const estaPago = valorPago > 0;

    return (
        <div className="space-y-6">

            {/* HEADER (MANTIDO IGUAL) */}
            <div className="flex items-start justify-between gap-4">
                <PageHeader
                    title="Editar Despesa"
                    description="Altere os dados da despesa provisionada"
                />

                <Link
                    href="/financeiro/despesas-previstas"
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
                        Informações da Despesa
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

                                    {CATEGORIAS_DESPESA.map((cat) => (
                                        <option
                                            key={cat.value}
                                            value={cat.value}
                                        >
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* VALOR */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Valor Provisionado *
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

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                            {/* FORMA DE PAGAMENTO */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Forma de Pagamento *
                                </label>

                                <select
                                    name="formaPagamento"
                                    value={formData.formaPagamento}
                                    onChange={handleChange}
                                    className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                                >
                                    <option value="PIX">PIX</option>
                                    <option value="DINHEIRO">Dinheiro</option>
                                    <option value="DEBITO">Cartão de Débito</option>
                                    <option value="CREDITO">Cartão de Crédito</option>
                                </select>
                            </div>

                            {/* DATA/VENCIMENTO */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    {formData.formaPagamento === "CREDITO"
                                        ? "Vencimento da Fatura *"
                                        : "Data de Vencimento *"}
                                </label>

                                <input
                                    type="date"
                                    name="dataVencimento"
                                    value={formData.dataVencimento}
                                    onChange={handleChange}
                                    disabled={
                                        formData.formaPagamento === "CREDITO"
                                    }
                                    className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:bg-slate-100"
                                />

                                {formData.formaPagamento === "CREDITO" &&
                                    cartaoSelecionado && (
                                        <p className="mt-1 text-xs text-slate-500">
                                            Data definida automaticamente pelo cartão selecionado.
                                        </p>
                                    )}
                            </div>

                        </div>

                        {formData.formaPagamento === "CREDITO" && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Cartão *
                                </label>

                                <select
                                    name="cartaoId"
                                    value={formData.cartaoId}
                                    onChange={handleChange}
                                    className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                                >
                                    <option value="">
                                        Selecione um cartão
                                    </option>

                                    {cartoes.map((cartao) => (
                                        <option
                                            key={cartao._id}
                                            value={cartao._id}
                                        >
                                            {cartao.nome}
                                        </option>
                                    ))}
                                </select>

                                {/* {cartaoSelecionado && (
                                    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                                        <p className="text-sm text-blue-800">
                                            Vencimento da fatura: dia{" "}
                                            <strong>
                                                {String(
                                                    cartaoSelecionado.vencimentoDia
                                                ).padStart(2, "0")}
                                            </strong>
                                        </p>
                                    </div>
                                )} */}
                            </div>
                        )}

                        {/* PAGAMENTO REAL */}
                        <div
                            className={`
        rounded-xl border-2 p-5 shadow-sm space-y-5 transition
        ${estaPago
                                    ? "border-green-300 bg-green-100/70"
                                    : "border-yellow-300 bg-yellow-100/70"
                                }
    `}
                        >

                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    💰 Pagamento realizado
                                </h3>

                                {estaPago ? (
                                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                        PAGO
                                    </span>
                                ) : (
                                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                                        NÃO PAGO
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* VALOR PAGO */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">
                                        Valor Pago
                                    </label>

                                    <input
                                        type="number"
                                        name="valorPago"
                                        value={formData.valorPago}
                                        onChange={handleChange}
                                        className={`
        mt-2 w-full rounded-lg border px-4 py-2 text-sm transition
        ${estaPago
                                                ? "border-green-400 bg-green-50"
                                                : "border-slate-300"
                                            }
    `}
                                    />

                                </div>

                                {/* DATA PAGAMENTO */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">
                                        Data do Pagamento
                                    </label>

                                    <input
                                        type="date"
                                        name="dataPagamento"
                                        value={formData.dataPagamento}
                                        onChange={handleChange}
                                        className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                                    />
                                </div>

                            </div>
                        </div>

                        {/* RECORRENTE */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-90">

                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={formData.recorrente}
                                    disabled
                                    readOnly
                                    className="h-5 w-5 accent-green-600 cursor-not-allowed opacity-100        "
                                />

                                <span
                                    className={`font-medium ${formData.recorrente ? "text-green-700" : "text-slate-700"}`}>
                                    Despesa recorrente
                                    <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                                        NÃO PODE SER ALTERADA
                                    </span>
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
                            href="/financeiro/despesas-previstas"
                            className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancelar
                        </Link>

                        <button
                            type="submit"
                            className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700"
                        >
                            <Save className="h-4 w-4" />
                            Atualizar Despesa
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}