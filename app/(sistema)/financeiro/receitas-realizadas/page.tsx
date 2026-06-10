//app/%28sistema%29/financeiro/receitas-realizadas/page.tsx
"use client";

import { Fragment } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader/PageHeader";
import { Edit, Plus, TrendingUp, Trash2 } from "lucide-react";
import { CATEGORIAS_LABEL } from "@/constants/categorias-receitas";
import toast from "react-hot-toast";

export default function ReceitasPage() {

    function toUTCDate(dateValue: string | Date) {
        const d = new Date(dateValue);

        return {
            mes: d.getUTCMonth() + 1,
            ano: d.getUTCFullYear(),
            data: new Date(
                d.getUTCFullYear(),
                d.getUTCMonth(),
                1
            ),
        };
    }


    const [receitas, setReceitas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [filterType, setFilterType] = useState<
        "month" | "year" | "day"
    >("month");

    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedYear, setSelectedYear] = useState("");

    const [startMonth, setStartMonth] = useState("");
    const [endMonth, setEndMonth] = useState("");

    useEffect(() => {
        carregarReceitas();
    }, []);

    async function carregarReceitas() {
        try {
            const response = await fetch("/api/financeiro/receitas-realizadas");

            const data = await response.json();

            setReceitas(data.receitas_realizadas || []);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    function excluirReceita(id: string) {
        toast((t) => (
            <div className="flex min-w-[280px] flex-col gap-3">
                <p className="font-medium text-slate-900">
                    Excluir receita realizada?
                </p>

                <p className="text-sm text-slate-500">
                    Todas as projeções futuras vinculadas a esta receita também serão removidas.
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
                            await excluirReceitaConfirmado(id);
                        }}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
                    >
                        Excluir
                    </button>
                </div>
            </div>
        ), {
            duration: 10000,
        });
    }

    async function excluirReceitaConfirmado(id: string) {
        try {
            const response = await fetch(
                `/api/financeiro/receitas-realizadas/${id}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            toast.success("Receita excluída com sucesso!");

            carregarReceitas();

        } catch (error) {
            console.error(error);

            toast.error("Erro ao excluir receita.");
        }
    }


    const mesesDisponiveis = useMemo(() => {
        const meses = receitas.map((r) => {
            const data = new Date(r.mesAno);

            return `${String(
                data.getUTCMonth() + 1
            ).padStart(2, "0")}-${data.getUTCFullYear()}`;
        });

        return [...new Set(meses)]
            .sort((a, b) => {
                const [mesA, anoA] = a.split("-");
                const [mesB, anoB] = b.split("-");

                return (
                    new Date(
                        Number(anoB),
                        Number(mesB) - 1
                    ).getTime() -
                    new Date(
                        Number(anoA),
                        Number(mesA) - 1
                    ).getTime()
                );
            });
    }, [receitas]);

    const anosDisponiveis = useMemo(() => {
        const anos = receitas.map((r) => {
            const info = toUTCDate(r.mesAno);

            return info.ano.toString();
        });

        return [...new Set(anos)]
            .sort()
            .reverse();
    }, [receitas]);

    useEffect(() => {
        if (!mesesDisponiveis.length) return;

        const hoje = new Date();

        const mesAtual = `${String(
            hoje.getUTCMonth() + 1
        ).padStart(2, "0")}-${hoje.getUTCFullYear()}`;

        if (mesesDisponiveis.includes(mesAtual)) {
            setSelectedMonth(mesAtual);
        } else {
            setSelectedMonth(mesesDisponiveis[0]);
        }
    }, [mesesDisponiveis]);


    const receitasFiltradas = useMemo(() => {
        return receitas.filter((receita) => {
            const dataInfo = toUTCDate(receita.mesAno);

            if (filterType === "month") {
                const chave = `${String(
                    dataInfo.mes
                ).padStart(2, "0")}-${dataInfo.ano}`;

                return chave === selectedMonth;
            }

            if (filterType === "year") {
                return (
                    dataInfo.ano.toString() === selectedYear
                );
            }

            if (
                filterType === "day" &&
                startMonth &&
                endMonth
            ) {
                const competencia = `${dataInfo.ano}-${String(
                    dataInfo.mes
                ).padStart(2, "0")}`;

                return (
                    competencia >= startMonth &&
                    competencia <= endMonth
                );
            }

            return true;
        });
    }, [
        receitas,
        filterType,
        selectedMonth,
        selectedYear,
        startMonth,
        endMonth,
    ]);

    useEffect(() => {
        if (!anosDisponiveis.length) return;

        const anoAtual = new Date()
            .getFullYear()
            .toString();

        if (anosDisponiveis.includes(anoAtual)) {
            setSelectedYear(anoAtual);
        } else {
            setSelectedYear(anosDisponiveis[0]);
        }
    }, [anosDisponiveis]);

    const totalReceitas = useMemo(() => {
        return receitasFiltradas.reduce(
            (acc, item) => acc + Number(item.valor),
            0
        );
    }, [receitasFiltradas]);

    const receitasAgrupadas = useMemo(() => {
        const grupos: Record<string, any[]> = {};

        receitasFiltradas.forEach((receita) => {
            const data = new Date(receita.mesAno);

            const chave = `${data.getUTCFullYear()}-${String(
                data.getUTCMonth() + 1
            ).padStart(2, "0")}`;

            if (!grupos[chave]) {
                grupos[chave] = [];
            }

            grupos[chave].push(receita);
        });

        return Object.entries(grupos).sort(
            ([a], [b]) => a.localeCompare(b)
        );
    }, [receitasFiltradas]);

    if (loading) {
        return (
            <div className="p-6">
                Carregando...
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex items-start justify-between">
                <PageHeader
                    title="Receitas Realizadas"
                    description="Gerencie receitas efetivamente recebidas"
                />

                <Link
                    href="/financeiro/receitas-realizadas/novo"
                    className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                    <Plus className="h-4 w-4" />
                    Nova Receita
                </Link>
            </div>

            {/* FILTROS */}
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
            <div className="grid gap-4">
                <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-green-100 p-3">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>

                        <div>
                            <p className="text-sm text-slate-500">
                                Total Receitas Recebidas
                            </p>

                            <p className="text-2xl font-bold text-slate-900">
                                {totalReceitas.toLocaleString(
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
                                Valor
                            </th>

                            <th className="px-4 py-3 text-left text-sm">
                                Descrição
                            </th>

                            <th className="px-4 py-3 text-center text-sm">
                                Ações
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {receitasAgrupadas.map(
                            ([mesAno, receitasMes]) => {
                                const [ano, mes] =
                                    mesAno.split("-");

                                const nomeMes = new Date(
                                    Number(ano),
                                    Number(mes) - 1
                                ).toLocaleDateString("pt-BR", {
                                    month: "long",
                                });

                                const totalMes =
                                    receitasMes.reduce(
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
                                                    <span className="ml-4 text-green-600">
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

                                        {receitasMes.map(
                                            (receita) => (
                                                <tr
                                                    key={receita._id}
                                                    className="border-t"
                                                >
                                                    <td className="px-4 py-3">
                                                        {(() => {
                                                            const d = new Date(
                                                                receita.mesAno
                                                            );

                                                            return `${String(
                                                                d.getUTCMonth() + 1
                                                            ).padStart(2, "0")}/${d.getUTCFullYear()}`;
                                                        })()}
                                                    </td>

                                                    <td className="px-4 py-3">

                                                        {CATEGORIAS_LABEL[receita.categoria] ?? receita.categoria}

                                                    </td>

                                                    <td className="px-4 py-3 font-semibold text-green-600">
                                                        {Number(
                                                            receita.valor
                                                        ).toLocaleString(
                                                            "pt-BR",
                                                            {
                                                                style:
                                                                    "currency",
                                                                currency:
                                                                    "BRL",
                                                            }
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        {
                                                            receita.observacao
                                                        }
                                                    </td>

                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <Link
                                                                href={`/financeiro/receitas-realizadas/${receita._id}`}
                                                                className="cursor-pointer"
                                                            >
                                                                <Edit className="h-4 w-4 text-slate-600 transition hover:scale-110 hover:text-green-600" />
                                                            </Link>

                                                            <button
                                                                onClick={() => excluirReceita(receita._id)}
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
