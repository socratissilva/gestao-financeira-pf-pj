//app/(sistema)/financeiro/despesas-previstas/novo/page.tsx
"use client";

import PageHeader from "@/components/PageHeader/PageHeader";
import { useEffect, useState } from "react";
import { ChevronLeft, Save } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
// import { CARTOES } from "@/constants/cartoes";
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

export default function NovoGanho() {
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

    const [cartoes, setCartoes] = useState<Cartao[]>([]);
    const [loadingCartoes, setLoadingCartoes] = useState(false);

    useEffect(() => {
        async function carregarCartoes() {
            try {
                setLoadingCartoes(true);

                const response = await fetch("/api/financeiro/cartoes");

                if (!response.ok) {
                    throw new Error("Erro ao buscar cartões");
                }

                const data = await response.json();

                // dependendo da sua API
                setCartoes(
                    Array.isArray(data)
                        ? data
                        : data.cartoes || []
                );
            } catch (error) {
                console.error(error);
                toast.error("Erro ao carregar cartões");
            } finally {
                setLoadingCartoes(false);
            }
        }

        carregarCartoes();
    }, []);


    useEffect(() => {
    if (formData.formaPagamento !== "CREDITO") return;

    if (!cartaoSelecionado) return;

    const [ano, mes] = formData.mesAno
        .split("-")
        .map(Number);

    const dia = cartaoSelecionado.vencimentoDia;

    const dataFormatada =
        `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

    console.log("VENCIMENTO GERADO:", dataFormatada);

    setFormData((prev) => ({
        ...prev,
        dataVencimento: dataFormatada,
    }));
}, [
    formData.formaPagamento,
    formData.cartaoId,
    formData.mesAno,
]);

    useEffect(() => {
        if (formData.formaPagamento !== "CREDITO") {
            setFormData((prev) => ({
                ...prev,
                dataVencimento: "",
                cartaoId: "",
            }));
        }
    }, [formData.formaPagamento]);


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

        if (
            formData.recorrente &&
            formData.mesAno &&
            formData.mesAnoFim
        ) {
            const inicio = Number(
                formData.mesAno.replace("-", "")
            );

            const fim = Number(
                formData.mesAnoFim.replace("-", "")
            );

            if (fim < inicio) {
                newErrors.mesAnoFim =
                    "O mês final deve ser maior ou igual ao mês inicial";
            }
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    console.log({
        mesAno: formData.mesAno,
        dataVencimento: formData.dataVencimento,
        formaPagamento: formData.formaPagamento,
        cartaoId: formData.cartaoId,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            const response = await fetch("/api/financeiro/despesas-previstas", {
                method: "POST",
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

                    mesAnoFim: formData.recorrente
                        ? formData.mesAnoFim
                        : null,

                    valorPago:
                        formData.valorPago === ""
                            ? null
                            : Number(formData.valorPago),

                    dataPagamento:
                        formData.dataPagamento || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            toast.success("Despesa cadastrada com sucesso!");

            setTimeout(() => {
                router.push("/financeiro/despesas-previstas");
            }, 1500);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao cadastrar despesa");
        }
    };
    const cartaoSelecionado = cartoes.find(
        (cartao) => cartao._id === formData.cartaoId
    );

    return (
        <div className="space-y-6">

            {/* HEADER (MANTIDO IGUAL) */}
            <div className="flex items-start justify-between gap-4">
                <PageHeader
                    title="Provisionar Despesa"
                    description="Cadastre despesas provisionadas do seu planejamento financeiro"
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
                                    <option value="TICKET">Ticket Alimentação</option>
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
                                    disabled={formData.formaPagamento === "CREDITO"}
                                    className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                                />

                                {formData.formaPagamento === "CREDITO" &&
                                    cartaoSelecionado && (
                                        <p className="mt-1 text-xs text-slate-500">
                                            Data definida automaticamente pelo cartão selecionado.
                                        </p>
                                    )}
                            </div>

                        </div>

                        {/* CARTÃO */}
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

                                {cartaoSelecionado && (
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
                                )}
                            </div>
                        )}

                        {formData.formaPagamento !== "CREDITO" && (
                            <input
                                type="hidden"
                                name="cartaoId"
                                value=""
                            />
                        )}

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
                                            mesAnoFim: e.target.checked
                                                ? prev.mesAno
                                                : "",
                                        }))
                                    }
                                />

                                <span className="font-medium text-slate-700">
                                    Despesa recorrente
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
                            Salvar Despesa
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}