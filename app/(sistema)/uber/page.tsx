//app/(sistema)/uber/page.tsx
"use client";
import PageHeader from "@/components/PageHeader/PageHeader";

import {
    TrendingUp,
    Fuel,
    Wallet,
    Target,
    Car,
    Clock3,
    Wrench,
} from "lucide-react";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    LineChart,
    Line,
} from "recharts";

import { useEffect, useMemo, useState } from "react";

interface Ganho {
    data: string;
    valorBruto: number;
    horasTrabalhadas: number;
    kmRodados: number;
}

interface Combustivel {
    data: string;
    valor: number;
}

interface Manutencao {
    data: string;
    valor: number;
}

export default function UberOverview() {
    const [filterType, setFilterType] =
        useState<"day" | "month" | "year">("month");

    const hoje = new Date();

    const formatDateInput = (date: Date) => {
        const year = date.getFullYear();
        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");
        const day = String(
            date.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const parseDate = (value: string) => {
        // evita shift de timezone
        const [y, m, d] = value.split("T")[0].split("-").map(Number);
        return new Date(y, m - 1, d);
    };

    const [selectedMonth, setSelectedMonth] = useState(() => {
        const hoje = new Date();

        return `${String(hoje.getMonth() + 1).padStart(2, "0")}-${hoje.getFullYear()}`;
    });

    const [startDate, setStartDate] = useState(() => {
        const hoje = new Date();

        return formatDateInput(
            new Date(
                hoje.getFullYear(),
                hoje.getMonth(),
                1
            )
        );
    });
    useState(
        formatDateInput(
            new Date(
                hoje.getFullYear(),
                hoje.getMonth(),
                1
            )
        )
    );

    const [endDate, setEndDate] = useState(() => {
        const hoje = new Date();

        return formatDateInput(
            new Date(
                hoje.getFullYear(),
                hoje.getMonth() + 1,
                0
            )
        );
    });
    useState(
        formatDateInput(
            new Date(
                hoje.getFullYear(),
                hoje.getMonth() + 1,
                0
            )
        )
    );

    // NOVOS STATES
    const [ganhos, setGanhos] =
        useState<Ganho[]>([]);

    const [combustiveis, setCombustiveis] =
        useState<Combustivel[]>([]);

    const [manutencoes, setManutencoes] =
        useState<Manutencao[]>([]);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        const carregarDados = async () => {
            try {
                setLoading(true);

                const [
                    ganhosRes,
                    combustivelRes,
                    manutencaoRes,
                ] = await Promise.all([
                    fetch("/api/uber/ganhos"),
                    fetch("/api/uber/combustivel"),
                    fetch("/api/uber/manutencao"),
                ]);

                const ganhosData = await ganhosRes.json();
                const combustivelData = await combustivelRes.json();
                const manutencaoData = await manutencaoRes.json();

                setGanhos(ganhosData.ganhos || []);
                setCombustiveis(
                    combustivelData.abastecimentos || []
                );
                setManutencoes(
                    manutencaoData.manutencoes || []
                );
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        carregarDados();
    }, []);

    const [selectedYear, setSelectedYear] =
        useState(
            new Date().getFullYear().toString()
        );

    const ganhosFiltrados = useMemo(() => {
        return ganhos.filter((item) => {
            const data = parseDate(item.data);
            if (filterType === "month") {
                const [mes, ano] = selectedMonth.split("-");

                const dataMes = data.getMonth() + 1;
                const dataAno = data.getFullYear();

                return (
                    dataMes === Number(mes) &&
                    dataAno === Number(ano)
                );
            }

            if (filterType === "year") {
                return (
                    data.getUTCFullYear() === Number(selectedYear)
                );
            }

            if (filterType === "day") {
                return (
                    data >= new Date(startDate) &&
                    data <= new Date(endDate)
                );
            }

            return true;
        });
    }, [
        ganhos,
        filterType,
        selectedMonth,
        selectedYear,
        startDate,
        endDate,
    ]);

    const combustiveisFiltrados = useMemo(() => {
        return combustiveis.filter((item) => {
            const data = parseDate(item.data);

            if (filterType === "month") {
                const [mes, ano] = selectedMonth.split("-");

                const dataMes = data.getMonth() + 1;
                const dataAno = data.getFullYear();

                return (
                    dataMes === Number(mes) &&
                    dataAno === Number(ano)
                );
            }

            if (filterType === "year") {
                return data.getUTCFullYear() === Number(selectedYear);
            }

            if (filterType === "day") {
                return (
                    data >= new Date(startDate) &&
                    data <= new Date(endDate)
                );
            }

            return true;
        });
    }, [
        combustiveis,
        filterType,
        selectedMonth,
        selectedYear,
        startDate,
        endDate,
    ]);

    const manutencoesFiltradas = useMemo(() => {
        return manutencoes.filter((item) => {
            const data = parseDate(item.data);

            if (filterType === "month") {
                const [mes, ano] = selectedMonth.split("-");

                const dataMes = data.getMonth() + 1;
                const dataAno = data.getFullYear();

                return (
                    dataMes === Number(mes) &&
                    dataAno === Number(ano)
                );
            }

            if (filterType === "year") {
                return (
                    data.getUTCFullYear() === Number(selectedYear)
                );
            }

            if (filterType === "day") {
                return (
                    data >= new Date(startDate) &&
                    data <= new Date(endDate)
                );
            }

            return true;
        });
    }, [
        manutencoes,
        filterType,
        selectedMonth,
        selectedYear,
        startDate,
        endDate,
    ]);



    const totalGanhos = useMemo(() => {
        return ganhosFiltrados.reduce(
            (acc, item) => acc + Number(item.valorBruto || 0),
            0
        );
    }, [ganhosFiltrados]);

    const totalCombustivel = useMemo(() => {
        return combustiveisFiltrados.reduce(
            (acc, item) => acc + Number(item.valor || 0),
            0
        );
    }, [combustiveisFiltrados]);

    const totalManutencao = useMemo(() => {
        return manutencoesFiltradas.reduce(
            (acc, item) => acc + Number(item.valor || 0),
            0
        );
    }, [manutencoesFiltradas]);

    const lucroLiquido =
        totalGanhos -
        totalCombustivel -
        totalManutencao;

    const formatMoney = (value: number) =>
        value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });

    const stats = [
        {
            label: "Ganhos Totais",
            value: formatMoney(totalGanhos),
            percentage: "",
            icon: TrendingUp,
            color: "bg-green-50",
            text: "text-green-600",
        },

        {
            label: "Combustível",
            value: formatMoney(totalCombustivel),
            percentage:
                totalGanhos > 0
                    ? `${(
                        (totalCombustivel / totalGanhos) *
                        100
                    ).toFixed(1)}% da receita`
                    : "0%",
            icon: Fuel,
            color: "bg-orange-50",
            text: "text-orange-600",
        },

        {
            label: "Manutenção",
            value: formatMoney(totalManutencao),
            percentage:
                totalGanhos > 0
                    ? `${(
                        (totalManutencao / totalGanhos) *
                        100
                    ).toFixed(1)}% da receita`
                    : "0%",
            icon: Wrench,
            color:
                "bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-500 shadow-lg",
            text: "text-red-600",
        },
    ];

    const totalHoras = useMemo(() => {
        return ganhosFiltrados.reduce(
            (acc, item) => acc + Number(item.horasTrabalhadas || 0),
            0
        );
    }, [ganhosFiltrados]);

    const totalKm = useMemo(() => {
        return ganhosFiltrados.reduce(
            (acc, item) => acc + Number(item.kmRodados || 0),
            0
        );
    }, [ganhosFiltrados]);

    const ganhoPorHora =
        totalHoras > 0
            ? totalGanhos / totalHoras
            : 0;

    const ganhoPorKm =
        totalKm > 0
            ? totalGanhos / totalKm
            : 0;

    const margemLucro =
        totalGanhos > 0
            ? (lucroLiquido / totalGanhos) * 100
            : 0;

    const chartData = useMemo(() => {
        const meses: Record<
            string,
            {
                mes: string;
                ordem: number;
                ganhos: number;
                despesas: number;
                lucro: number;
            }
        > = {};

        ganhosFiltrados.forEach((item) => {
            const data = parseDate(item.data);

            const chave = `${String(data.getMonth() + 1).padStart(2, "0")}-${data.getFullYear()}`;

            if (!meses[chave]) {
                meses[chave] = {
                    mes: chave,
                    ordem: data.getFullYear() * 100 + (data.getMonth() + 1),
                    ganhos: 0,
                    despesas: 0,
                    lucro: 0,
                };
            }

            meses[chave].ganhos += Number(item.valorBruto || 0);
        });

        combustiveisFiltrados.forEach((item) => {
            const data = parseDate(item.data);

            const chave = `${String(data.getMonth() + 1).padStart(2, "0")}-${data.getFullYear()}`;

            if (!meses[chave]) {
                meses[chave] = {
                    mes: chave,
                    ordem: data.getFullYear() * 100 + (data.getMonth() + 1),
                    ganhos: 0,
                    despesas: 0,
                    lucro: 0,
                };
            }

            meses[chave].despesas += Number(item.valor || 0);
        });

        manutencoesFiltradas.forEach((item) => {
            const data = parseDate(item.data);

            const chave = `${String(data.getMonth() + 1).padStart(2, "0")}-${data.getFullYear()}`;

            if (!meses[chave]) {
                meses[chave] = {
                    mes: chave,
                    ordem: data.getFullYear() * 100 + (data.getMonth() + 1),
                    ganhos: 0,
                    despesas: 0,
                    lucro: 0,
                };
            }

            meses[chave].despesas += Number(item.valor || 0);
        });

        return Object.values(meses)
            .sort((a, b) => a.ordem - b.ordem)
            .map((item) => {
                const [mes, ano] = item.mes.split("-");

                const nomeMes = new Date(Number(ano), Number(mes) - 1)
                    .toLocaleDateString("pt-BR", { month: "short" });

                return {
                    ...item,
                    mes: `${nomeMes} ${ano}`,
                    lucro: item.ganhos - item.despesas,
                };
            });
    }, [ganhosFiltrados, combustiveisFiltrados, manutencoesFiltradas]);

    const indicadores = [
        {
            label: "Horas Trabalhadas",
            value: `${totalHoras.toFixed(1)}h`,
            icon: Clock3,
            color: "text-slate-500",
        },
        {
            label: "KM Rodados",
            value: `${totalKm.toLocaleString("pt-BR")} km`,
            icon: Car,
            color: "text-slate-500",
        },
        {
            label: "Ganho por Hora",
            value: `${formatMoney(ganhoPorHora)}/h`,
            icon: TrendingUp,
            color: "text-green-600",
        },
        {
            label: "Ganho por KM",
            value: `${formatMoney(ganhoPorKm)}/km`,
            icon: Fuel,
            color: "text-blue-600",
        },
        {
            label: "Saúde Financeira",
            value: "87/100 Excelente",
            icon: Target,
            color: "text-green-700",
            badge: true,
        },
    ];

    const mesesDisponiveis = useMemo(() => {
        const meses = new Set<string>();

        ganhos.forEach((item) => {
            const data = parseDate(item.data);

            const mes = String(data.getMonth() + 1).padStart(2, "0");
            const ano = data.getFullYear();

            meses.add(`${mes}-${ano}`);
        });

        return Array.from(meses).sort((a, b) => {
            const [mesA, anoA] = a.split("-").map(Number);
            const [mesB, anoB] = b.split("-").map(Number);

            return anoB * 100 + mesB - (anoA * 100 + mesA);
        });
    }, [ganhos]);


    const anosDisponiveis = useMemo(() => {
        const anos = new Set<string>();

        ganhos.forEach((item) => {
            anos.add(
                String(
                    new Date(item.data).getFullYear()
                )
            );
        });

        return Array.from(anos).sort(
            (a, b) => Number(b) - Number(a)
        );
    }, [ganhos]);

    useEffect(() => {
        if (
            mesesDisponiveis.length > 0 &&
            !selectedMonth
        ) {
            setSelectedMonth(
                mesesDisponiveis[0]
            );
        }
    }, [mesesDisponiveis, selectedMonth]);

    useEffect(() => {
        if (
            anosDisponiveis.length > 0 &&
            !selectedYear
        ) {
            setSelectedYear(
                anosDisponiveis[0]
            );
        }
    }, [anosDisponiveis, selectedYear]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Uber"
                description="Acompanhe seu desempenho financeiro e operacional"
            />

            {/* Filtros */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-6">

                    {/* ESQUERDA */}
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="filterType"
                                checked={filterType === "month"}
                                onChange={() => setFilterType("month")}
                            />
                            <span className="text-sm font-medium text-slate-700">
                                Por Mês
                            </span>
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="filterType"
                                checked={filterType === "year"}
                                onChange={() => setFilterType("year")}
                            />
                            <span className="text-sm font-medium text-slate-700">
                                Por Ano
                            </span>
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="filterType"
                                checked={filterType === "day"}
                                onChange={() => setFilterType("day")}
                            />
                            <span className="text-sm font-medium text-slate-700">
                                Por Período
                            </span>
                        </label>
                    </div>

                    {/* DIREITA */}
                    <div>
                        {filterType === "month" && (
                            <select
                                value={selectedMonth}
                                onChange={(e) =>
                                    setSelectedMonth(e.target.value)
                                }
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
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
                        )}

                        {filterType === "year" && (
                            <select
                                value={selectedYear}
                                onChange={(e) =>
                                    setSelectedYear(e.target.value)
                                }
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
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
                        )}

                        {filterType === "day" && (
                            <div className="flex items-center gap-4">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                                />

                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                                />
                            </div>
                        )}
                    </div>

                </div>
            </div>


            {/* Cards */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">

                {/* Receita Líquida */}
                <div className="rounded-xl bg-blue-600 p-6 text-white shadow-lg lg:col-span-2">
                    <div className="mb-5 flex items-center justify-between">

                        <div>
                            <p className="text-sm text-blue-100">
                                Receita Líquida
                            </p>

                            <h2 className="mt-2 text-4xl font-bold">
                                {formatMoney(lucroLiquido)}
                            </h2>
                        </div>

                        <Wallet className="h-10 w-10 text-blue-100" />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span>
                            {margemLucro.toFixed(1)}% de margem de lucro
                        </span>

                        <span className="rounded-full bg-blue-500 px-3 py-1">
                            Dados Reais
                        </span>
                    </div>
                </div>

                {/* Cards menores */}
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;

                    return (
                        <div
                            key={idx}
                            className={`rounded-xl border border-slate-200 p-6 shadow-sm ${stat.color}`}
                        >
                            <div className="mb-4 flex items-center justify-between">

                                <Icon className={`h-6 w-6 ${stat.text}`} />

                                <span className={`text-xs font-semibold ${stat.text}`}>
                                    {stat.percentage}
                                </span>
                            </div>

                            <h3 className="text-sm font-medium text-slate-600">
                                {stat.label}
                            </h3>

                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                {stat.value}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Gráfico Financeiro */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Comparativo Financeiro
                    </h2>

                    <p className="text-sm text-slate-500">
                        Ganhos, despesas e lucro dos últimos 12 meses
                    </p>
                </div>

                <ResponsiveContainer width="100%" height={380}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis dataKey="mes" />

                        <YAxis />

                        <Tooltip
                            formatter={(value) => [
                                `R$ ${Number(value).toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                })}`,
                            ]}
                        />

                        <Legend />

                        <Bar
                            dataKey="ganhos"
                            name="Ganhos"
                            fill="#22c55e"
                            radius={[6, 6, 0, 0]}
                        />

                        <Bar
                            dataKey="despesas"
                            name="Despesas"
                            fill="#ef4444"
                            radius={[6, 6, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Linha de Lucro */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Tendência de Lucro
                    </h2>

                    <p className="text-sm text-slate-500">
                        Evolução do lucro líquido ao longo do tempo
                    </p>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis dataKey="mes" />

                        <YAxis />

                        <Tooltip
                            formatter={(value) => [
                                `R$ ${Number(value).toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                })}`,
                            ]}
                        />

                        <Line
                            type="monotone"
                            dataKey="lucro"
                            stroke="#2563eb"
                            strokeWidth={3}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Resumos */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                {/* Resumo Inteligente */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

                    <div className="mb-5 flex items-center gap-3">
                        <Target className="h-6 w-6 text-blue-600" />

                        <h2 className="text-lg font-semibold text-slate-900">
                            Resumo Inteligente
                        </h2>
                    </div>

                    <div className="space-y-4 text-sm text-slate-700">

                        <div className="rounded-lg bg-green-50 p-4">
                            Lucro líquido atual: {formatMoney(lucroLiquido)}
                        </div>

                        <div className="rounded-lg bg-orange-50 p-4">
                            Combustível representa{" "}
                            {totalGanhos > 0
                                ? ((totalCombustivel / totalGanhos) * 100).toFixed(1)
                                : 0}
                            % da receita.
                        </div>

                        <div className="rounded-lg bg-red-50 p-4">
                            Manutenção representa{" "}
                            {totalGanhos > 0
                                ? ((totalManutencao / totalGanhos) * 100).toFixed(1)
                                : 0}
                            % da receita.
                        </div>

                        <div className="rounded-lg bg-blue-50 p-4">
                            Ganho médio por hora: {formatMoney(ganhoPorHora)}
                        </div>

                    </div>
                </div>

                {/* Indicadores */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

                    <h2 className="mb-6 text-lg font-semibold text-slate-900">
                        Indicadores Operacionais
                    </h2>

                    <div className="space-y-5">
                        {indicadores.map((item, idx) => {
                            const Icon = item.icon;

                            return (
                                <div key={idx} className="flex items-center justify-between">

                                    <div className="flex items-center gap-3">
                                        <Icon className={`h-5 w-5 ${item.color}`} />

                                        <span className="text-slate-700">
                                            {item.label}
                                        </span>
                                    </div>

                                    {item.badge ? (
                                        <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                                            {item.value}
                                        </span>
                                    ) : (
                                        <span className={`font-semibold ${item.color}`}>
                                            {item.value}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}