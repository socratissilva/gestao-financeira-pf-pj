"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader/PageHeader";
import {
    Edit,
    Plus,
    Trash2,
    TrendingDown,
    CheckCircle,
    Clock3,
    AlertTriangle,
    TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { CARTOES } from "@/constants/cartoes";
import { CATEGORIAS_DESPESA_LABEL } from "@/constants/categorias-despesas";

const hoje = new Date();

const mesAtual = `${String(hoje.getUTCMonth() + 1).padStart(
    2,
    "0"
)}-${hoje.getUTCFullYear()}`;

export default function DespesasPage() {
    const [despesas, setDespesas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [filterType, setFilterType] = useState<
        "month" | "year" | "day"
    >("month");

    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedYear, setSelectedYear] = useState("");

    const [startMonth, setStartMonth] = useState("");
    const [endMonth, setEndMonth] = useState("");

    const [isInitialized, setIsInitialized] = useState(false);

    function toUTCDate(dateValue: string | Date) {
        const d = new Date(dateValue);

        return {
            mes: d.getUTCMonth() + 1,
            ano: d.getUTCFullYear(),
            data: new Date(d.getUTCFullYear(), d.getUTCMonth(), 1),
        };
    }

    useEffect(() => {
        carregarDespesas();
    }, []);

    async function carregarDespesas() {
        try {
            const response = await fetch("/api/financeiro/despesas-previstas");

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Erro ao buscar despesas");
            }

            const data = await response.json();
            setDespesas(data.despesas_previstas || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    function excluirDespesa(id: string) {
        toast((t) => (
            <div className="flex min-w-[280px] flex-col gap-3">
                <p className="font-medium text-slate-900">
                    Excluir despesa provisionada?
                </p>

                <p className="text-sm text-slate-500">
                    Todas as projeções futuras vinculadas a esta despesa também serão removidas.
                </p>

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                    >
                        Cancelar
                    </button>

                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            await excluirDespesaConfirmado(id);
                        }}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
                    >
                        Excluir
                    </button>
                </div>
            </div>
        ));
    }

    async function excluirDespesaConfirmado(id: string) {
        try {
            const response = await fetch(
                `/api/financeiro/despesas-previstas/${id}`,
                { method: "DELETE" }
            );

            const data = await response.json();

            if (!response.ok) throw new Error(data.message);

            toast.success("Despesa excluída com sucesso!");
            carregarDespesas();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao excluir despesa.");
        }
    }

    const despesasExpandidas = useMemo(() => {
        return despesas.map((d: any) => ({
            ...d,
            dataProjecao: d.mesAno,
            origemId: d._id,
        }));
    }, [despesas]);

    const mesesDisponiveis = useMemo(() => {
        const meses = despesasExpandidas.map((d) => {
            const data = new Date(d.dataProjecao || d.mesAno);

            return `${String(data.getUTCMonth() + 1).padStart(
                2,
                "0"
            )}-${data.getUTCFullYear()}`;
        });

        return [...new Set(meses)].sort((a, b) => {
            const [mesA, anoA] = a.split("-");
            const [mesB, anoB] = b.split("-");

            return (
                new Date(Number(anoA), Number(mesA) - 1).getTime() -
                new Date(Number(anoB), Number(mesB) - 1).getTime()
            );
        });
    }, [despesasExpandidas]);

    const anosDisponiveis = useMemo(() => {
        const anos = despesasExpandidas.map((d) => {
            const info = toUTCDate(d.dataProjecao || d.mesAno);
            return info.ano.toString();
        });

        return [...new Set(anos)].sort(
            (a, b) => Number(a) - Number(b)
        );
    }, [despesasExpandidas]);

    // 🔥 INICIALIZAÇÃO CORRETA (NÃO SOBRESCREVE USUÁRIO)
    useEffect(() => {
        if (!mesesDisponiveis.length) return;

        const hoje = new Date();
        const mesAtualStr = `${String(hoje.getMonth() + 1).padStart(2, "0")}-${hoje.getFullYear()}`;

        // 1) se existe mês atual nos dados
        if (mesesDisponiveis.includes(mesAtualStr)) {
            setSelectedMonth(mesAtualStr);
            return;
        }

        // 2) senão, pega o mês mais próximo do atual (não o mais recente)
        const ordenadoPorProximidade = [...mesesDisponiveis].sort((a, b) => {
            const [ma, ya] = a.split("-");
            const [mb, yb] = b.split("-");

            const da = new Date(Number(ya), Number(ma) - 1).getTime();
            const db = new Date(Number(yb), Number(mb) - 1).getTime();

            const diffA = Math.abs(da - hoje.getTime());
            const diffB = Math.abs(db - hoje.getTime());

            return diffA - diffB;
        });

        setSelectedMonth(ordenadoPorProximidade[0]);
    }, [mesesDisponiveis]);

    useEffect(() => {
        if (!anosDisponiveis.length) return;

        const anoAtual = new Date().getFullYear().toString();

        // 1) se existe ano atual nos dados
        if (anosDisponiveis.includes(anoAtual)) {
            setSelectedYear(anoAtual);
            return;
        }

        // 2) senão pega o ano mais próximo do atual
        const ordenadoPorProximidade = [...anosDisponiveis].sort((a, b) => {
            const diffA = Math.abs(Number(a) - Number(anoAtual));
            const diffB = Math.abs(Number(b) - Number(anoAtual));
            return diffA - diffB;
        });

        setSelectedYear(ordenadoPorProximidade[0]);
    }, [anosDisponiveis]);

    const despesasFiltradas = useMemo(() => {
        return despesasExpandidas.filter((despesa) => {
            const d = new Date(despesa.dataProjecao || despesa.mesAno);

            const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
            const ano = d.getUTCFullYear();
            const chaveMes = `${mes}-${ano}`;

            if (filterType === "month") {
                return chaveMes === selectedMonth;
            }

            if (filterType === "year") {
                return selectedYear
                    ? ano.toString() === selectedYear
                    : true;
            }

            if (filterType === "day") {
                if (!startMonth || !endMonth) return true;

                const competencia = `${ano}-${mes}`;
                return competencia >= startMonth && competencia <= endMonth;
            }

            return true;
        });
    }, [
        despesasExpandidas,
        filterType,
        selectedMonth,
        selectedYear,
        startMonth,
        endMonth,
    ]);

    const totalDespesas = useMemo(() => {
        return despesasFiltradas.reduce(
            (acc, item) => acc + Number(item.valor),
            0
        );
    }, [despesasFiltradas]);

    const totalPago = useMemo(() => {
        return despesasFiltradas.reduce(
            (acc, item) =>
                acc + Number(item.valorPago || 0),
            0
        );
    }, [despesasFiltradas]);

    const despesasAgrupadas = useMemo(() => {
        let lista = [...despesasFiltradas];

        // ✅ ORDENAÇÃO GLOBAL (FUNCIONA PARA MONTH / YEAR / DAY)
        lista.sort((a, b) => {
            const da = a.dataVencimento
                ? new Date(a.dataVencimento).getTime()
                : 0;

            const db = b.dataVencimento
                ? new Date(b.dataVencimento).getTime()
                : 0;

            return da - db;
        });


        const grupos: Record<string, any[]> = {};

        lista.forEach((despesa) => {
            const data = new Date(despesa.dataProjecao || despesa.mesAno);

            const chave = `${data.getUTCFullYear()}-${String(
                data.getUTCMonth() + 1
            ).padStart(2, "0")}`;

            if (!grupos[chave]) grupos[chave] = [];
            grupos[chave].push(despesa);
        });

        return Object.entries(grupos).sort(([a], [b]) =>
            a.localeCompare(b)
        );
    }, [despesasFiltradas, filterType]);

    if (loading) return <div className="p-6">Carregando...</div>;
    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex items-start justify-between">
                <PageHeader
                    title="Gestão de Despesas"
                    description="Gerencie suas despesas e saídas financeiras"
                />

                <Link
                    href="/financeiro/despesas-previstas/novo"
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                    <Plus className="h-4 w-4" />
                    Nova Despesa
                </Link>
            </div>

            {/* FILTROS */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                    <div className="flex flex-wrap items-center gap-5">

                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="filterType"
                                value="month"
                                checked={filterType === "month"}
                                onChange={() => setFilterType("month")}
                                className="h-4 w-4 cursor-pointer"
                            />

                            <span className="text-sm font-medium text-slate-700">
                                Por Mês
                            </span>
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="filterType"
                                value="year"
                                checked={filterType === "year"}
                                onChange={() => setFilterType("year")}
                                className="h-4 w-4 cursor-pointer"
                            />

                            <span className="text-sm font-medium text-slate-700">
                                Por Ano
                            </span>
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="filterType"
                                value="day"
                                checked={filterType === "day"}
                                onChange={() => setFilterType("day")}
                                className="h-4 w-4 cursor-pointer"
                            />

                            <span className="text-sm font-medium text-slate-700">
                                Por Período
                            </span>
                        </label>

                    </div>

                    {filterType === "month" ? (

                        <select
                            value={selectedMonth}
                            onChange={(e) =>
                                setSelectedMonth(e.target.value)
                            }
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-green-500 focus:outline-none"
                        >
                            {mesesDisponiveis.map((mes) => {

                                const [numeroMes, ano] = mes.split("-");

                                const nomeMes = new Date(
                                    Number(ano),
                                    Number(numeroMes) - 1
                                ).toLocaleDateString("pt-BR", {
                                    month: "long",
                                });

                                return (
                                    <option
                                        key={mes}
                                        value={mes}
                                    >
                                        {nomeMes.charAt(0).toUpperCase() +
                                            nomeMes.slice(1)}{" "}
                                        {ano}
                                    </option>
                                );
                            })}
                        </select>

                    ) : filterType === "year" ? (

                        <select
                            value={selectedYear}
                            onChange={(e) =>
                                setSelectedYear(e.target.value)
                            }
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-green-500 focus:outline-none"
                        >
                            {anosDisponiveis.map((ano) => (
                                <option
                                    key={ano}
                                    value={ano}
                                >
                                    {ano}
                                </option>
                            ))}
                        </select>

                    ) : (

                        <div className="flex flex-col gap-3 sm:flex-row">

                            <input
                                type="month"
                                value={startMonth}
                                onChange={(e) => setStartMonth(e.target.value)}
                                className="rounded-xl border border-slate-300 px-4 py-2 text-sm"
                            />

                            <input
                                type="month"
                                value={endMonth}
                                onChange={(e) => setEndMonth(e.target.value)}
                                className="rounded-xl border border-slate-300 px-4 py-2 text-sm"
                            />

                        </div>

                    )}
                </div>
            </div>

            {/* RESUMO */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-red-100 p-3">
                            <TrendingDown className="h-5 w-5 text-red-600" />
                        </div>

                        <div>
                            <p className="text-sm text-slate-500">
                                Total de Despesas Provisionadas
                            </p>

                            <p className="text-2xl font-bold text-red-600">
                                {totalDespesas.toLocaleString(
                                    "pt-BR",
                                    {
                                        style: "currency",
                                        currency: "BRL",
                                    }
                                )}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">

                        <div className="rounded-xl bg-green-100 p-3">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>

                        <div>
                            <p className="text-sm text-slate-500">
                                Despesas Pagas
                            </p>

                            <p className="text-2xl font-bold text-green-600">
                                {totalPago.toLocaleString(
                                    "pt-BR",
                                    {
                                        style: "currency",
                                        currency: "BRL",
                                    }
                                )}
                            </p>
                        </div>

                    </div>
                </div>
            </div>


            {/* TABELA */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm">
                                Mês/Ano
                            </th>

                            <th className="px-4 py-3 text-left text-sm">
                                Categoria
                            </th>

                            <th className="px-4 py-3 text-left text-sm">
                                Valor Provisionado
                            </th>

                            <th className="px-4 py-3 text-left text-sm">
                                Valor Pago
                            </th>

                            <th className="px-4 py-3 text-left text-sm">
                                Vencimento
                            </th>

                            <th className="px-4 py-3 text-center text-sm">
                                Ações
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {despesasAgrupadas.map(
                            ([mesAno, despesasMes]) => {
                                const [ano, mes] =
                                    mesAno.split("-");

                                const nomeMes = new Date(
                                    Number(ano),
                                    Number(mes) - 1
                                ).toLocaleDateString("pt-BR", {
                                    month: "long",
                                });

                                const totalMes =
                                    despesasMes.reduce(
                                        (acc, item) =>
                                            acc + Number(item.valor),
                                        0
                                    );

                                return (
                                    <Fragment key={mesAno}>
                                        <tr
                                            key={`grupo-${mesAno}`}
                                            className="bg-slate-100"
                                        >
                                            <td
                                                colSpan={6}
                                                className="px-4 py-3 font-bold text-slate-800"
                                            >
                                                {nomeMes.toUpperCase()} {ano}

                                                {filterType !== "month" && (
                                                    <span className="ml-4 text-red-600">
                                                        (
                                                        {totalMes.toLocaleString("pt-BR", {
                                                            style: "currency",
                                                            currency: "BRL",
                                                        })}
                                                        )
                                                    </span>
                                                )}
                                            </td>
                                        </tr>

                                        {despesasMes.map(
                                            (despesa) => (
                                                <tr
                                                    key={`${despesa.origemId}-${despesa.dataProjecao}`}
                                                    className="border-t"
                                                >
                                                    <td className="px-4 py-3">
                                                        {(() => {
                                                            const d = new Date(
                                                                despesa.dataProjecao ||
                                                                despesa.mesAno
                                                            );

                                                            return `${String(
                                                                d.getUTCMonth() + 1
                                                            ).padStart(2, "0")}/${d.getUTCFullYear()}`;
                                                        })()}
                                                    </td>

                                                    <td className="px-4 py-3">

                                                        {CATEGORIAS_DESPESA_LABEL[despesa.categoria] ?? despesa.categoria}

                                                    </td>

                                                    {/* VALOR PROVISIONADO */}
                                                    <td className="px-4 py-3 600">
                                                        {Number(
                                                            despesa.valor
                                                        ).toLocaleString(
                                                            "pt-BR",
                                                            {
                                                                style: "currency",
                                                                currency: "BRL",
                                                            }
                                                        )}
                                                    </td>

                                                    {/* VALOR PAGO */}
                                                    <td className="px-4 py-3">
                                                        {(() => {
                                                            const valorPago = Number(despesa.valorPago || 0);

                                                            if (valorPago > 0) {
                                                                return (
                                                                    <div className="flex items-center gap-2 text-green-600 font-semibold">
                                                                        <CheckCircle className="h-4 w-4" />

                                                                        {valorPago.toLocaleString(
                                                                            "pt-BR",
                                                                            {
                                                                                style: "currency",
                                                                                currency: "BRL",
                                                                            }
                                                                        )}
                                                                    </div>
                                                                );
                                                            }

                                                            const hoje = new Date();

                                                            const vencimento = despesa.dataVencimento
                                                                ? new Date(despesa.dataVencimento)
                                                                : null;

                                                            const atrasada =
                                                                vencimento &&
                                                                vencimento < hoje;

                                                            return atrasada ? (
                                                                <div className="flex items-center gap-2 text-red-600 font-semibold">
                                                                    <AlertTriangle className="h-4 w-4" />
                                                                    Atrasada
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2 text-yellow-600 font-semibold">
                                                                    <Clock3 className="h-4 w-4" />
                                                                    Pendente
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>

                                                    {/* VENCIMENTO */}
                                                    <td
                                                        className={`px-4 py-3 font-medium ${despesa.dataVencimento &&
                                                            new Date(despesa.dataVencimento) < new Date() &&
                                                            (!despesa.valorPago || despesa.valorPago <= 0)
                                                            ? "text-red-600"
                                                            : "text-slate-700"
                                                            }`}
                                                    >
                                                        {despesa.dataVencimento
                                                            ? new Date(
                                                                despesa.dataVencimento
                                                            ).toLocaleDateString("pt-BR")
                                                            : "-"}
                                                    </td>

                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <Link
                                                                href={`/financeiro/despesas-previstas/${despesa.origemId}`}
                                                                className="cursor-pointer"
                                                            >
                                                                <Edit className="h-4 w-4 text-slate-600 transition hover:scale-110 hover:text-blue-600" />
                                                            </Link>

                                                            <button
                                                                onClick={() => excluirDespesa(despesa.origemId)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-600 transition hover:scale-110 hover:text-red-700" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </Fragment>
                                );
                            }
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
