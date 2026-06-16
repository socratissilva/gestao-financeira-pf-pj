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
                fetch("/api/financeiro/cartoes", { cache: "no-store" }),
                fetch("/api/financeiro/despesas-previstas", { cache: "no-store" }),
            ]);

            const cartoesData = await resCartoes.json();
            const despesasData = await resDespesas.json();


            setCartoes(cartoesData || []);
            setDespesas(despesasData.despesas_previstas || []);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        carregarDados();

        const onFocus = () => carregarDados();

        window.addEventListener("focus", onFocus);

        return () => window.removeEventListener("focus", onFocus);
    }, []);

    const getCompetencia = (dateStr: string) => {
        const data = new Date(dateStr);

        return `${String(
            data.getUTCMonth() + 1
        ).padStart(2, "0")}-${data.getUTCFullYear()}`;
    };

    const mesesPT = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];

    const formatCompetencia = (competencia: string) => {
        const [mes, ano] = competencia.split("-");
        return `${mesesPT[Number(mes) - 1]}/${ano}`;
    };

    // -------------------------
    // FILTRO BASE
    // -------------------------
    const despesasCredito = useMemo(() => {
        return despesas.filter((d) => d.formaPagamento === "CREDITO");
    }, [despesas]);

    // -------------------------
    // RESUMO CARTÕES (CORRIGIDO)
    // -------------------------
    const cartoesComResumo = useMemo(() => {
        if (!cartoes.length) return [];

            return cartoes.map((cartao) => {
            const idCartao = String(cartao._id);

            const gastosDoCartao = despesas.filter(
                (d) => String(d.cartaoId?._id || d.cartaoId) === idCartao
            );

            const abertasGlobais = gastosDoCartao.filter((d) => {
                const valor = Number(d.valor || 0);
                const pago = Number(d.valorPago || 0);

                return pago < valor;
            });

            const totalEmAbertoGlobal = abertasGlobais.reduce(
                (acc, d) => {
                    const valor = Number(d.valor || 0);
                    const pago = Number(d.valorPago || 0);

                    return acc + Math.max(valor - pago, 0);
                },
                0
            );

            // -------------------------
            // FILTRO DE EXIBIÇÃO
            // -------------------------
            let comprasFiltradas = gastosDoCartao;

            if (filterType === "year") {
                comprasFiltradas = gastosDoCartao.filter((d) => {
                    const ano = new Date(
                        d.mesAno
                    ).getFullYear();

                    return ano === Number(selectedYear);
                });
            }

            if (filterType === "period") {
                comprasFiltradas = gastosDoCartao.filter((d) => {
                    const data = new Date(d.mesAno);

                    const competencia = `${data.getUTCFullYear()}-${String(
                        data.getUTCMonth() + 1
                    ).padStart(2, "0")}`;

                    return (
                        competencia >= startMonth &&
                        competencia <= endMonth
                    );
                });
            }

            if (filterType === "month") {
                comprasFiltradas = gastosDoCartao.filter((d) => {
                    const competencia = getCompetencia(
                        d.mesAno
                    );

                    return competencia === selectedMonth;
                });
            }

            // -------------------------
            // ABERTAS E PAGAS
            // AGORA RESPEITANDO O FILTRO
            // -------------------------
            const abertas = comprasFiltradas.filter((d) => {
                const pago = Number(d.valorPago || 0);
                const valor = Number(d.valor || 0);

                return pago < valor;
            });

            const pagas = comprasFiltradas.filter((d) => {
                const pago = Number(d.valorPago || 0);
                const valor = Number(d.valor || 0);

                return pago >= valor;
            });


            console.table(
                comprasFiltradas.map((d) => ({
                    valor: d.valor,
                    valorPago: d.valorPago,
                    restante:
                        Number(d.valor || 0) -
                        Number(d.valorPago || 0),
                    categoria: d.categoria,
                    mesAno: d.mesAno,
                }))
            );

            const totalGasto = abertas.reduce((acc, d) => {
                const valor = Number(d.valor || 0);
                const pago = Number(d.valorPago || 0);

                return acc + Math.max(valor - pago, 0);
            }, 0);


            // -------------------------
            // TOTAL EM ABERTO
            // -------------------------
            const totalEmAberto = abertas.reduce((acc, d) => {
                const valor = Number(d.valor || 0);
                const pago = Number(d.valorPago || 0);

                return acc + Math.max(valor - pago, 0);
            }, 0);

            const limite = Number(cartao.limite || 0);

            const disponivel = limite - totalEmAbertoGlobal;

            const percentualUtilizado =
                limite > 0
                    ? (totalEmAbertoGlobal / limite) * 100
                    : 0;

            return {
                ...cartao,

                totalGasto,

                quantidadeCompras: comprasFiltradas.length,

                abertas: abertas.length,
                pagas: pagas.length,

                totalEmAberto: totalEmAbertoGlobal,

                disponivel,

                percentualUtilizado,
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
    // OPÇÕES
    // -------------------------
    const mesesDisponiveis = useMemo(() => {
        const meses = despesasCredito.map((d) => {
            const data = new Date(d.dataVencimento || d.mesAno);

            return `${String(data.getUTCMonth() + 1).padStart(2, "0")}-${data.getUTCFullYear()}`;
        });

        return [...new Set(meses)].sort((a, b) => {
            const [mesA, anoA] = a.split("-");
            const [mesB, anoB] = b.split("-");

            return (
                new Date(Number(anoA), Number(mesA) - 1).getTime() -
                new Date(Number(anoB), Number(mesB) - 1).getTime()
            );
        });
    }, [despesasCredito]);

    const anosDisponiveis = useMemo(() => {
        const anos = despesasCredito.map((d) =>
            new Date(
                d.dataVencimento || d.mesAno
            ).getUTCFullYear().toString()
        );

        return [...new Set(anos)].sort(
            (a, b) => Number(a) - Number(b)
        );
    }, [despesasCredito]);

    // -------------------------
    // AUTO SELEÇÃO
    // -------------------------
    useEffect(() => {
        if (mesesDisponiveis.length) {
            setSelectedMonth(
                mesesDisponiveis.includes(mesAtual)
                    ? mesAtual
                    : mesesDisponiveis[0]
            );
        }
    }, [mesesDisponiveis, mesAtual]);

    useEffect(() => {
        if (anosDisponiveis.length) {
            setSelectedYear(
                anosDisponiveis.includes(anoAtual)
                    ? anoAtual
                    : anosDisponiveis[0]
            );
        }
    }, [anosDisponiveis, anoAtual]);

    if (loading) return <div className="p-6">Carregando...</div>;

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

                    <div className="flex gap-5">
                        <label>
                            <input type="radio" checked={filterType === "month"} onChange={() => setFilterType("month")} />
                            Mês
                        </label>

                        <label>
                            <input type="radio" checked={filterType === "year"} onChange={() => setFilterType("year")} />
                            Ano
                        </label>

                        <label>
                            <input type="radio" checked={filterType === "period"} onChange={() => setFilterType("period")} />
                            Período
                        </label>
                    </div>

                    {filterType === "month" && (
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm"
                        >
                            {mesesDisponiveis.map((m) => (
                                <option key={m} value={m}>
                                    {formatCompetencia(m)}
                                </option>
                            ))}
                        </select>
                    )}

                    {filterType === "year" && (
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm"
                        >
                            {anosDisponiveis.map((a) => (
                                <option key={a}>{a}</option>
                            ))}
                        </select>
                    )}

                    {filterType === "period" && (
                        <div className="flex gap-2">
                            <input
                                type="month"
                                value={startMonth}
                                onChange={(e) => setStartMonth(e.target.value)}
                                className="rounded-lg border border-slate-300 px-3 py-2"
                            />

                            <input
                                type="month"
                                value={endMonth}
                                onChange={(e) => setEndMonth(e.target.value)}
                                className="rounded-lg border border-slate-300 px-3 py-2"
                            />
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
                        className="rounded-2xl border bg-white p-5 shadow-sm cursor-pointer hover:shadow-lg hover:-translate-y-1 transition"
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
                            <span>
                                {cartao.quantidadeCompras}{" "}
                                {cartao.quantidadeCompras === 1 ? "compra" : "compras"}
                            </span>

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
                                        cartao.percentualUtilizado,
                                        100
                                    )}%`,
                                }}
                            />
                        </div>

                        <div className="mt-2 flex justify-between text-xs text-slate-500">
                            <span>
                                Limite:{" "}
                                {Number(cartao.limite || 0).toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                })}
                            </span>

                            <span className={cartao.disponivel < 0 ? "text-red-600" : "text-green-600"}>
                                Disponível:{" "}
                                {cartao.disponivel.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                })}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}