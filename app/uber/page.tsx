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

import { useState } from "react";

export default function UberOverview() {
    const [filterType, setFilterType] = useState<"day" | "month" | "year">("month");

    const [selectedMonth, setSelectedMonth] = useState("05-2026");

    const [startDate, setStartDate] = useState("2026-05-01");

    const [endDate, setEndDate] = useState("2026-05-25");

    const chartData = [
        { mes: "Jun", ganhos: 2600, despesas: 520, lucro: 2080 },
        { mes: "Jul", ganhos: 2400, despesas: 490, lucro: 1910 },
        { mes: "Ago", ganhos: 2800, despesas: 610, lucro: 2190 },
        { mes: "Set", ganhos: 3000, despesas: 720, lucro: 2280 },
        { mes: "Out", ganhos: 2750, despesas: 580, lucro: 2170 },
        { mes: "Nov", ganhos: 3200, despesas: 760, lucro: 2440 },
        { mes: "Dez", ganhos: 3500, despesas: 890, lucro: 2610 },
        { mes: "Jan", ganhos: 2900, despesas: 640, lucro: 2260 },
        { mes: "Fev", ganhos: 2700, despesas: 600, lucro: 2100 },
        { mes: "Mar", ganhos: 2800, despesas: 670, lucro: 2130 },
        { mes: "Abr", ganhos: 2100, despesas: 400, lucro: 1700 },
        { mes: "Mai", ganhos: 2450, despesas: 530, lucro: 1920 },
    ].slice(-12);

    const monthlyStats = {
        "05-2026": {
            ganhos: "R$ 2.450,00",
            combustivel: "R$ 380,50",
            manutencao: "R$ 150,00",
            lucroLiquido: "R$ 1.919,50",
        },
    };

    const currentStats =
        monthlyStats[selectedMonth as keyof typeof monthlyStats] ||
        monthlyStats["05-2026"];

    const stats = [
        {
            label: "Ganhos Totais",
            value: currentStats.ganhos,
            percentage: "+12%",
            icon: TrendingUp,
            color: "bg-green-50",
            text: "text-green-600",
        },

        {
            label: "Combustível",
            value: currentStats.combustivel,
            percentage: "15% da receita",
            icon: Fuel,
            color: "bg-orange-50",
            text: "text-orange-600",
        },

        {
            label: "Manutenção",
            value: currentStats.manutencao,
            percentage: "6% da receita",
            icon: Wrench,
            color: "bg-red-50",
            text: "text-red-600",
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Uber"
                description="Acompanhe seu desempenho financeiro e operacional"
            />

            {/* Filtros */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-end gap-6">
                    <div className="flex flex-wrap items-center gap-4">
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

                    {filterType === "month" && (
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                        >
                            <option value="05-2026">Maio 2026</option>
                            <option value="04-2026">Abril 2026</option>
                            <option value="03-2026">Março 2026</option>
                        </select>
                    )}

                    {filterType === "year" && (
                        <select className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
                            <option>2026</option>
                            <option>2025</option>
                            <option>2024</option>
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
                                {currentStats.lucroLiquido}
                            </h2>
                        </div>

                        <Wallet className="h-10 w-10 text-blue-100" />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span>78% de margem de lucro</span>

                        <span className="rounded-full bg-blue-500 px-3 py-1">
                            ↑ +18%
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
                            formatter={(value: number) =>
                                `R$ ${value.toLocaleString("pt-BR")}`
                            }
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
                            formatter={(value: number) =>
                                `R$ ${value.toLocaleString("pt-BR")}`
                            }
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
                            Seu lucro líquido aumentou 12% em relação ao mês anterior.
                        </div>

                        <div className="rounded-lg bg-orange-50 p-4">
                            O combustível representou 15% da sua receita mensal.
                        </div>

                        <div className="rounded-lg bg-red-50 p-4">
                            Os custos de manutenção ficaram abaixo da média histórica.
                        </div>

                        <div className="rounded-lg bg-blue-50 p-4">
                            Seu melhor desempenho ocorreu nos finais de semana.
                        </div>
                    </div>
                </div>

                {/* Indicadores */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

                    <h2 className="mb-6 text-lg font-semibold text-slate-900">
                        Indicadores Operacionais
                    </h2>

                    <div className="space-y-5">

                        <div className="flex items-center justify-between">

                            <div className="flex items-center gap-3">
                                <Clock3 className="h-5 w-5 text-slate-500" />

                                <span className="text-slate-700">
                                    Horas Trabalhadas
                                </span>
                            </div>

                            <span className="font-semibold">
                                72h
                            </span>
                        </div>

                        <div className="flex items-center justify-between">

                            <div className="flex items-center gap-3">
                                <Car className="h-5 w-5 text-slate-500" />

                                <span className="text-slate-700">
                                    KM Rodados
                                </span>
                            </div>

                            <span className="font-semibold">
                                1.240 km
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-slate-700">
                                Ganho por Hora
                            </span>

                            <span className="font-semibold text-green-600">
                                R$ 34/h
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-slate-700">
                                Ganho por KM
                            </span>

                            <span className="font-semibold text-blue-600">
                                R$ 1,97/km
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-slate-700">
                                Saúde Financeira
                            </span>

                            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                                87/100 Excelente
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}