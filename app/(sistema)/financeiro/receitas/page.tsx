// app/(sistema)/financeiro/receitas/page.tsx
"use client";

import PageHeader from "@/components/PageHeader/PageHeader";
import {
    TrendingUp,
    Calendar,
    Wallet,
    Plus,
    Target,
    Repeat,
    PiggyBank,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Receita {
    _id: string;
    data: string;
    categoria: string;
    valor: number;
    observacao?: string;
    recorrente: boolean;
    dataFim?: string;
    ativa?: boolean;
}

export default function ReceitasPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [receitas, setReceitas] = useState<Receita[]>([]);

    const hoje = new Date();

    const primeiroDiaMes = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        1
    );

    const ultimoDiaMes = new Date(
        hoje.getFullYear(),
        hoje.getMonth() + 1,
        0
    );

    const [filterType, setFilterType] = useState<
        "month" | "year" | "day"
    >("month");

    // ✅ FIX: mês inicial já válido
    const [selectedMonth, setSelectedMonth] = useState(() => {
        return `${String(hoje.getMonth() + 1).padStart(2, "0")}-${hoje.getFullYear()}`;
    });

    const [selectedYear, setSelectedYear] = useState(
        new Date().getFullYear().toString()
    );

    const [startDate, setStartDate] = useState(
        primeiroDiaMes.toISOString().split("T")[0]
    );

    const [endDate, setEndDate] = useState(
        ultimoDiaMes.toISOString().split("T")[0]
    );

    useEffect(() => {
        fetchReceitas();
    }, []);

    async function fetchReceitas() {
        try {
            setLoading(true);

            const response = await fetch("/api/financeiro/receitas");

            if (!response.ok) {
                throw new Error("Erro ao buscar receitas");
            }

            const data = await response.json();

            setReceitas(data.receitas || []);
        } catch (error) {
            console.error("Erro fetch receitas:", error);
        } finally {
            setLoading(false);
        }
    }

    function formatMoney(valor: number) {
        return valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    }

    /* =====================================
       FILTROS
    ===================================== */

    const receitasFiltradas = receitas.filter((receita) => {
        const data = new Date(receita.data);

        // ✅ FIX: usar local time (evita bug de timezone)
        if (filterType === "month") {
            const [mes, ano] = selectedMonth.split("-");

            return (
                data.getMonth() + 1 === Number(mes) &&
                data.getFullYear() === Number(ano)
            );
        }

        if (filterType === "year") {
            return data.getFullYear() === Number(selectedYear);
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

    /* =====================================
       INDICADORES
    ===================================== */

    const totalReceitas = receitasFiltradas.reduce(
        (acc, item) => acc + Number(item.valor || 0),
        0
    );

    const totalRecorrente = receitasFiltradas
        .filter((item) => item.recorrente)
        .reduce((acc, item) => acc + Number(item.valor || 0), 0);

    const totalEventual = receitasFiltradas
        .filter((item) => !item.recorrente)
        .reduce((acc, item) => acc + Number(item.valor || 0), 0);

    const quantidadeReceitas = receitasFiltradas.length;

    const ticketMedio =
        quantidadeReceitas > 0
            ? totalReceitas / quantidadeReceitas
            : 0;

    const projecaoMensal = totalRecorrente;
    const projecao12Meses = projecaoMensal * 12;

    /* =====================================
       CARDS
    ===================================== */

    const cards = [
        {
            title: "Receitas Totais",
            value: formatMoney(totalReceitas),
            subtitle: `${quantidadeReceitas} lançamentos`,
            icon: Wallet,
            iconBg: "bg-green-100",
            iconColor: "text-green-600",
            destaque: true,
        },
        {
            title: "Receitas Recorrentes",
            value: formatMoney(totalRecorrente),
            subtitle: "Receitas mensais recorrentes",
            icon: Repeat,
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
        },
        {
            title: "Receitas Eventuais",
            value: formatMoney(totalEventual),
            subtitle: "Receitas não recorrentes",
            icon: PiggyBank,
            iconBg: "bg-purple-100",
            iconColor: "text-purple-600",
        },
        {
            title: "Ticket Médio",
            value: formatMoney(ticketMedio),
            subtitle: "Valor médio por lançamento",
            icon: Target,
            iconBg: "bg-amber-100",
            iconColor: "text-amber-600",
        },
        {
            title: "Projeção Mensal",
            value: formatMoney(projecaoMensal),
            subtitle: "Baseada nas recorrentes",
            icon: TrendingUp,
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-600",
        },
        {
            title: "Projeção 12 Meses",
            value: formatMoney(projecao12Meses),
            subtitle: "Receita prevista anual",
            icon: Calendar,
            iconBg: "bg-cyan-100",
            iconColor: "text-cyan-600",
        },
    ];

    /* =====================================
       MESES DISPONÍVEIS
    ===================================== */

    const mesesDisponiveis = useMemo(() => {
        const meses = new Set<string>();

        receitas.forEach((item) => {
            const data = new Date(item.data);

            meses.add(
                `${String(data.getMonth() + 1).padStart(2, "0")}-${data.getFullYear()}`
            );
        });

        return Array.from(meses).sort((a, b) => {
            const [mesA, anoA] = a.split("-");
            const [mesB, anoB] = b.split("-");

            return (
                Number(anoB) * 100 +
                Number(mesB) -
                (Number(anoA) * 100 + Number(mesA))
            );
        });
    }, [receitas]);

    /* =====================================
       ANOS DISPONÍVEIS
    ===================================== */

    const anosDisponiveis = useMemo(() => {
        const anos = new Set<string>();

        receitas.forEach((item) => {
            anos.add(String(new Date(item.data).getFullYear()));
        });

        return Array.from(anos).sort((a, b) => Number(b) - Number(a));
    }, [receitas]);

    /* =====================================
       AUTO SET MÊS
    ===================================== */

    useEffect(() => {
        if (mesesDisponiveis.length > 0) {
            setSelectedMonth((prev) => prev || mesesDisponiveis[0]);
        }
    }, [mesesDisponiveis]);

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <PageHeader
                    title="Receitas"
                    description="Controle e projeção das receitas financeiras"
                />

                <button
                    onClick={() =>
                        router.push("/financeiro/receitas/novo")
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
                >
                    <Plus className="h-5 w-5" />
                    Nova Receita
                </button>
            </div>
        </div>
    );
}