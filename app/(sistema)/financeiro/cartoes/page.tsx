"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader/PageHeader";
import { CreditCard, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CartoesPage() {
    const router = useRouter();

    const [cartoes, setCartoes] = useState<any[]>([]);
    const [despesas, setDespesas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const hoje = new Date();

    const mesAtual = `${String(hoje.getMonth() + 1).padStart(2, "0")}-${hoje.getFullYear()}`;
    const anoAtual = hoje.getFullYear().toString();

    const [filterType, setFilterType] = useState<"month" | "year" | "period">("month");

    const [selectedMonth, setSelectedMonth] = useState(mesAtual);
    const [selectedYear, setSelectedYear] = useState(anoAtual);
    const [startMonth, setStartMonth] = useState(mesAtual);
    const [endMonth, setEndMonth] = useState(mesAtual);

    // -------------------------
    // FETCH
    // -------------------------
    async function carregarDados() {
        try {
            setLoading(true);

            const [resCartoes, resDespesas] = await Promise.all([
                fetch("/api/financeiro/cartoes"),
                fetch("/api/financeiro/despesas-previstas"),
            ]);

            const cartoesData = await resCartoes.json();
            const despesasData = await resDespesas.json();

            setCartoes(cartoesData || []);
            setDespesas(despesasData.despesas_previstas || []);
        } catch (err) {
            console.error("ERRO CARREGAMENTO:", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        carregarDados();
    }, []);

    const getCompetencia = (dateStr: string) => {
        const data = new Date(dateStr);
        return `${String(data.getMonth() + 1).padStart(2, "0")}-${data.getFullYear()}`;
    };

    const mesesPT = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];

    const formatCompetencia = (competencia: string) => {
        const [mes, ano] = competencia.split("-");

        const mesNome = mesesPT[Number(mes) - 1];

        return `${mesNome}/${ano}`;
    };

    // -------------------------
    // FILTRO BASE
    // -------------------------
    const despesasCredito = useMemo(() => {
        return despesas.filter((d) => d.formaPagamento === "CREDITO");
    }, [despesas]);

    // -------------------------
    // FILTRO PRINCIPAL
    // -------------------------
    const despesasFiltradas = useMemo(() => {
        return despesasCredito.filter((despesa: any) => {
            const competencia = getCompetencia(
                despesa.dataVencimento || despesa.mesAno
            );

            if (filterType === "month") {
                return competencia === selectedMonth;
            }

            if (filterType === "year") {
                return competencia.endsWith(selectedYear);
            }

            if (filterType === "period") {
                const start = startMonth; // "2026-06"
                const end = endMonth;     // "2026-07"

                const startDate = new Date(start + "-01");
                const endDate = new Date(end + "-01");

                return despesasCredito.some(() => {
                    const competencia = getCompetencia(despesa.dataVencimento || despesa.mesAno);

                    const compDate = new Date((competencia.split("-")[1] + "-" + competencia.split("-")[0]) + "-01");

                    return compDate >= startDate && compDate <= endDate;
                });
            }

            return true;
        });
    }, [despesasCredito, filterType, selectedMonth, selectedYear, startMonth, endMonth]);

    // -------------------------
    // NORMALIZA ID (CRÍTICO)
    // -------------------------
    const normalizeId = (id: any) => {
        if (!id) return null;

        if (typeof id === "string") return id;

        if (typeof id === "object" && id._id) return id._id;

        return null;
    };

    // -------------------------
    // RESUMO CARTÕES
    // -------------------------
    const cartoesComResumo = useMemo(() => {
        if (!cartoes.length) return [];

        const startDate = new Date(startMonth + "-01");
        const endDate = new Date(endMonth + "-01");

        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0); // último dia do mês

        return cartoes.map((cartao) => {
            const idCartao = String(cartao._id);

            const gastosDoCartao = despesas.filter((d) => {
                return String(d.cartaoId?._id || d.cartaoId) === idCartao;
            });

            let valoresExpandidos: number[] = [];

            if (filterType === "year") {
                valoresExpandidos = gastosDoCartao
                    .filter((d) => {
                        const ano = new Date(
                            d.dataVencimento || d.mesAno
                        ).getFullYear();

                        return ano === Number(selectedYear);
                    })
                    .map((d) => Number(d.valor));
            }

            if (filterType === "period") {
                valoresExpandidos = gastosDoCartao
                    .filter((d) => {
                        const data = new Date(
                            d.dataVencimento || d.mesAno
                        );

                        return data >= startDate && data <= endDate;
                    })
                    .map((d) => Number(d.valor));
            }

            if (filterType === "month") {
                valoresExpandidos = gastosDoCartao
                    .filter((d) => {
                        const competencia = getCompetencia(
                            d.dataVencimento || d.mesAno
                        );
                        return competencia === selectedMonth;
                    })
                    .map((d) => Number(d.valor));
            }

            const totalGasto = valoresExpandidos.reduce(
                (acc, val) => acc + val,
                0
            );

            const limite = Number(cartao.limite || 0);

            // TODAS as despesas do cartão, independente do filtro
            const totalLancadoCartao = gastosDoCartao.reduce(
                (acc, despesa) => acc + Number(despesa.valor || 0),
                0
            );

            const disponivel = limite - totalLancadoCartao;

            return {
                ...cartao,
                totalGasto,
                disponivel,
                totalLancadoCartao,
                quantidadeCompras: valoresExpandidos.length,
            };
        });
    }, [
        cartoes,
        despesas,
        filterType,
        selectedMonth,
        selectedYear,
        startMonth,
        endMonth,
    ]);

    // -------------------------
    // OPÇÕES DE FILTRO
    // -------------------------
    const mesesDisponiveis = useMemo(() => {
        const meses = despesasCredito.map((d) => {
            const data = new Date(d.dataVencimento || d.mesAno);
            return `${String(data.getUTCMonth() + 1).padStart(2, "0")}-${data.getUTCFullYear()}`;
        });

        return [...new Set(meses)].sort();
    }, [despesasCredito]);

    const anosDisponiveis = useMemo(() => {
        const anos = despesasCredito.map((d) =>
            new Date(d.dataVencimento || d.mesAno).getUTCFullYear().toString()
        );

        return [...new Set(anos)].sort().reverse();
    }, [despesasCredito]);

    // -------------------------
    // AUTO SELEÇÃO
    // -------------------------
    useEffect(() => {
        if (mesesDisponiveis.length) {
            setSelectedMonth(mesesDisponiveis.includes(mesAtual) ? mesAtual : mesesDisponiveis[0]);
        }
    }, [mesesDisponiveis, mesAtual]);

    useEffect(() => {
        if (anosDisponiveis.length) {
            setSelectedYear(anosDisponiveis.includes(anoAtual) ? anoAtual : anosDisponiveis[0]);
        }
    }, [anosDisponiveis, anoAtual]);

    // -------------------------
    // LOADING
    // -------------------------
    if (loading) {
        return <div className="p-6">Carregando...</div>;
    }

    // -------------------------
    // UI
    // -------------------------
    return (
        <div className="space-y-6">

            <PageHeader
                title="Cartões"
                description="Visualize os gastos provisionados por cartão"
            />

            <div className="flex justify-end">
                <button
                    onClick={() => router.push("/financeiro/cartoes/novo")}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700 transition"
                >
                    <Plus size={16} />
                    Novo cartão
                </button>
            </div>

            {/* FILTROS */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                    <div className="flex flex-wrap items-center gap-5">

                        <label className="flex items-center gap-2">
                            <input type="radio" checked={filterType === "month"} onChange={() => setFilterType("month")} />
                            Por Mês
                        </label>

                        <label className="flex items-center gap-2">
                            <input type="radio" checked={filterType === "year"} onChange={() => setFilterType("year")} />
                            Por Ano
                        </label>

                        <label className="flex items-center gap-2">
                            <input type="radio" checked={filterType === "period"} onChange={() => setFilterType("period")} />
                            Por Período
                        </label>
                    </div>

                    {filterType === "month" && (
                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                            {mesesDisponiveis.map((m) => <option key={m} value={m}>
                                {formatCompetencia(m)}
                            </option>)}
                        </select>
                    )}

                    {filterType === "year" && (
                        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                            {anosDisponiveis.map((a) => <option key={a}>{a}</option>)}
                        </select>
                    )}

                    {filterType === "period" && (
                        <div className="flex gap-2">
                            <input type="month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} />
                            <input type="month" value={endMonth} onChange={(e) => setEndMonth(e.target.value)} />
                        </div>
                    )}
                </div>
            </div>

            {/* CARDS */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {cartoesComResumo.map((cartao) => (
                    <div
                        key={cartao._id}
                        onClick={() => router.push(`/financeiro/cartoes/${cartao._id}`)}
                        className="rounded-2xl border bg-white p-5 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 hover:bg-slate-50"
                    >

                        <div className="flex justify-between">
                            <div className="flex gap-2 items-center">
                                <CreditCard className="h-5 w-5" />
                                <h3 className="font-semibold">{cartao.nome}</h3>
                            </div>

                            <span className="text-xs text-slate-500">
                                vence dia {cartao.vencimentoDia}
                            </span>
                        </div>

                        <div className="mt-4 flex justify-between text-sm">
                            <span>{cartao.quantidadeCompras} compras</span>
                            <span className="text-red-600 font-semibold">
                                {cartao.totalGasto.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                })}
                            </span>
                        </div>

                        <div className="mt-3 h-2 bg-slate-100 rounded-full">
                            <div
                                className="h-2 bg-blue-500 rounded-full"
                                style={{
                                    width: `${Math.min(
                                        (cartao.totalGasto / (cartao.limite || 1)) * 100,
                                        100
                                    )}%`,
                                }}
                            />
                        </div>

                        <div className="mt-2 flex justify-between text-xs text-slate-500">
                            <span>
                                Limite:{" "}
                                {Number(cartao.limite || 0).toLocaleString(
                                    "pt-BR",
                                    {
                                        style: "currency",
                                        currency: "BRL",
                                    }
                                )}
                            </span>

                            <span
                                className={
                                    cartao.disponivel < 0
                                        ? "text-red-600 font-medium"
                                        : "text-green-600 font-medium"
                                }
                            >
                                Disponível:{" "}
                                {cartao.disponivel.toLocaleString(
                                    "pt-BR",
                                    {
                                        style: "currency",
                                        currency: "BRL",
                                    }
                                )}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}