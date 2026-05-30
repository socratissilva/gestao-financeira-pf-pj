"use client";

import PageHeader from "@/components/PageHeader/PageHeader";

import {
    TrendingUp,
    Calendar,
    Clock3,
    Car,
    Plus,
    Filter,
    Wallet,
    Edit,
    Gauge,
} from "lucide-react";
import Link from "next/link";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Ganho {
    _id: string;
    data: string;
    valorBruto: number;
    horasTrabalhadas: number;
    kmRodados: number;
    plataforma: string;
    observacao?: string;

    combustivel?: number;
    manutencao?: number;
    viagens?: number;
}

export default function GanhosUber() {
    const router = useRouter();

    const [filterType, setFilterType] = useState<
        "day" | "month" | "year"
    >("month");

    const [selectedMonth, setSelectedMonth] =
        useState("05-2026");

    const [selectedYear, setSelectedYear] =
        useState("2026");

    const [startDate, setStartDate] =
        useState("2026-05-01");

    const [endDate, setEndDate] =
        useState("2026-05-25");

    const [ganhos, setGanhos] = useState<Ganho[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGanhos();
    }, []);

    async function fetchGanhos() {
        try {
            setLoading(true);

            const response = await fetch(
                "/api/uber/ganhos"
            );

            const data = await response.json();

            setGanhos(data.ganhos || []);
        } catch (error) {
            console.error(
                "Erro ao buscar ganhos:",
                error
            );
        } finally {
            setLoading(false);
        }
    }

    /* =========================================================
       FILTROS
    ========================================================= */

    const ganhosFiltrados = ganhos.filter((ganho) => {
        const data = new Date(ganho.data);

        if (filterType === "month") {
            const [mes, ano] =
                selectedMonth.split("-");

            return (
                data.getUTCMonth() + 1 ===
                Number(mes) &&
                data.getUTCFullYear() ===
                Number(ano)
            );
        }

        if (filterType === "year") {
            return (
                data.getUTCFullYear() ===
                Number(selectedYear)
            );
        }

        if (filterType === "day") {
            const inicio = new Date(startDate);
            const fim = new Date(endDate);

            inicio.setHours(0, 0, 0, 0);
            fim.setHours(23, 59, 59, 999);

            return data >= inicio && data <= fim;
        }

        return true;
    });

    /* =========================================================
       CÁLCULOS
    ========================================================= */

    const totalGanhos = ganhosFiltrados.reduce(
        (acc, g) =>
            acc + Number(g.valorBruto || 0),
        0
    );

    const totalHoras = ganhosFiltrados.reduce(
        (acc, g) =>
            acc +
            Number(g.horasTrabalhadas || 0),
        0
    );

    const totalKm = ganhosFiltrados.reduce(
        (acc, g) =>
            acc + Number(g.kmRodados || 0),
        0
    );

    const mediaPorDia = ganhosFiltrados.length
        ? (
            totalGanhos /
            ganhosFiltrados.length
        ).toFixed(2)
        : "0.00";

    const mediaPorHora = totalHoras
        ? (totalGanhos / totalHoras).toFixed(2)
        : "0.00";

    const ganhoPorKm = totalKm
        ? (totalGanhos / totalKm).toFixed(2)
        : "0.00";

    const produtividadeKmHora = totalHoras
        ? (totalKm / totalHoras).toFixed(1)
        : "0.0";

    const cards = [
        {
            title: "Ganhos Totais",
            value: `R$ ${totalGanhos.toFixed(
                2
            )}`,
            subtitle: `${ganhosFiltrados.length} registros cadastrados`,
            icon: TrendingUp,
            iconBg: "bg-green-100",
            iconColor: "text-green-600",
        },
        {
            title: "Média por Dia",
            value: `R$ ${mediaPorDia}`,
            subtitle: "Média diária de ganhos",
            icon: Calendar,
            iconBg: "bg-purple-100",
            iconColor: "text-purple-600",
        },
        {
            title: "Ganho por Hora",
            value: `R$ ${mediaPorHora}`,
            subtitle: "Rentabilidade por hora",
            icon: Clock3,
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600",
        },
        {
            title: "Ganho por KM",
            value: `R$ ${ganhoPorKm}`,
            subtitle: "Média por quilômetro",
            icon: Gauge,
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-600",
        },
        {
            title: "Produtividade",
            value: `${produtividadeKmHora} km/h`,
            subtitle:
                "Média de deslocamento por hora",
            icon: TrendingUp,
            iconBg: "bg-cyan-100",
            iconColor: "text-cyan-600",
        },
        {
            title: "KM Rodados",
            value: `${totalKm} km`,
            subtitle: "Total percorrido",
            icon: Car,
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <PageHeader
                    title="Ganhos Uber"
                    description="Acompanhe seus ganhos e desempenho operacional"
                />

                <button
                    onClick={() =>
                        router.push(
                            "/uber/ganhos/novo"
                        )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
                >
                    <Plus className="h-5 w-5" />
                    Adicionar Ganho
                </button>
            </div>

            {/* Filtros */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex flex-wrap items-center gap-5">
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="filterType"
                                value="month"
                                checked={
                                    filterType ===
                                    "month"
                                }
                                onChange={() =>
                                    setFilterType(
                                        "month"
                                    )
                                }
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
                                checked={
                                    filterType ===
                                    "year"
                                }
                                onChange={() =>
                                    setFilterType(
                                        "year"
                                    )
                                }
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
                                checked={
                                    filterType ===
                                    "day"
                                }
                                onChange={() =>
                                    setFilterType(
                                        "day"
                                    )
                                }
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
                                setSelectedMonth(
                                    e.target.value
                                )
                            }
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-green-500 focus:outline-none"
                        >
                            <option value="05-2026">
                                Maio 2026
                            </option>

                            <option value="04-2026">
                                Abril 2026
                            </option>

                            <option value="03-2026">
                                Março 2026
                            </option>
                        </select>
                    ) : filterType === "year" ? (
                        <select
                            value={selectedYear}
                            onChange={(e) =>
                                setSelectedYear(
                                    e.target.value
                                )
                            }
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-green-500 focus:outline-none"
                        >
                            <option value="2026">
                                2026
                            </option>

                            <option value="2025">
                                2025
                            </option>

                            <option value="2024">
                                2024
                            </option>
                        </select>
                    ) : (
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) =>
                                    setStartDate(
                                        e.target.value
                                    )
                                }
                                className="rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
                            />

                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) =>
                                    setEndDate(
                                        e.target.value
                                    )
                                }
                                className="rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Loading */}
            {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                    <p className="text-slate-500">
                        Carregando ganhos...
                    </p>
                </div>
            ) : (
                <>
                    {/* Cards */}
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {cards
                                .slice(0, 3)
                                .map((card, idx) => {
                                    const Icon =
                                        card.icon;

                                    const isHighlighted = card.title === "Ganhos Totais";

                                    return (
                                        <div
                                            key={
                                                card.title
                                            }
                                            className={`group rounded-2xl p-6 transition-all duration-200 ${isHighlighted
                                                ? "border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg hover:-translate-y-2 hover:shadow-2xl"
                                                : "border border-slate-200 bg-white shadow-sm hover:-translate-y-1 hover:shadow-lg"
                                                }`}
                                        >
                                            <div className="mb-5 flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-slate-500">
                                                        {
                                                            card.title
                                                        }
                                                    </p>

                                                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                                                        {
                                                            card.value
                                                        }
                                                    </h2>
                                                </div>

                                                <div
                                                    className={`rounded-2xl p-3 ${card.iconBg}`}
                                                >
                                                    <Icon
                                                        className={`h-6 w-6 ${card.iconColor}`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="h-px w-full bg-slate-100" />

                                            <p className="mt-4 text-xs text-slate-500">
                                                {
                                                    card.subtitle
                                                }
                                            </p>
                                        </div>
                                    );
                                })}
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {cards
                                .slice(3, 6)
                                .map((card) => {
                                    const Icon =
                                        card.icon;

                                    return (
                                        <div
                                            key={
                                                card.title
                                            }
                                            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                                        >
                                            <div className="mb-5 flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-slate-500">
                                                        {
                                                            card.title
                                                        }
                                                    </p>

                                                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                                                        {
                                                            card.value
                                                        }
                                                    </h2>
                                                </div>

                                                <div
                                                    className={`rounded-2xl p-3 ${card.iconBg}`}
                                                >
                                                    <Icon
                                                        className={`h-6 w-6 ${card.iconColor}`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="h-px w-full bg-slate-100" />

                                            <p className="mt-4 text-xs text-slate-500">
                                                {
                                                    card.subtitle
                                                }
                                            </p>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    {/* Histórico */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">
                                    Histórico de Ganhos
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Registros recentes de ganhos
                                    e produtividade
                                </p>
                            </div>

                            <button className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                                <Filter className="h-4 w-4" />
                                Filtrar
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Data
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Plataforma
                                        </th>

                                        <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Horas
                                        </th>

                                        <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            KM
                                        </th>

                                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Ganho
                                        </th>

                                        <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Ação
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {ganhosFiltrados.length >
                                        0 ? (
                                        ganhosFiltrados.map(
                                            (ganho) => (
                                                <tr
                                                    key={
                                                        ganho._id
                                                    }
                                                    className="transition hover:bg-slate-50"
                                                >
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                                        {new Date(
                                                            ganho.data
                                                        ).toLocaleDateString(
                                                            "pt-BR",
                                                            {
                                                                timeZone:
                                                                    "UTC",
                                                            }
                                                        )}
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                                                            {
                                                                ganho.plataforma
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4 text-center text-sm text-slate-700">
                                                        {
                                                            ganho.horasTrabalhadas
                                                        }
                                                        h
                                                    </td>

                                                    <td className="px-6 py-4 text-center text-sm text-slate-700">
                                                        {
                                                            ganho.kmRodados
                                                        }{" "}
                                                        km
                                                    </td>

                                                    <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                                                        R${" "}
                                                        {Number(
                                                            ganho.valorBruto ||
                                                            0
                                                        ).toFixed(
                                                            2
                                                        )}
                                                    </td>

                                                    <td className="px-6 py-4 text-center">
                                                        <Link
                                                            href={`/uber/ganhos/${ganho._id}`}
                                                            className="inline-flex items-center justify-center rounded-lg border border-slate-300 p-2 transition hover:bg-slate-100"
                                                            title="Editar ganho"
                                                        >
                                                            <Edit className="h-4 w-4 text-slate-600" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            )
                                        )
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-6 py-14 text-center text-sm text-slate-500"
                                            >
                                                Nenhum ganho encontrado para este filtro.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}