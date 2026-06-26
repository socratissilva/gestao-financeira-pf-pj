//api/dash
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import ReceitaPrevista from "@/models/ReceitaPrevista";
import ReceitaRealizada from "@/models/ReceitaRealizada";
import DespesaPrevista from "@/models/DespesaPrevista";

export const runtime = "nodejs";

function getMesAnoFormatted(date: Date): string {
  const d = new Date(date);

  // força "meio-dia UTC" para evitar rollback de timezone
  d.setUTCHours(12, 0, 0, 0);

  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

export async function GET(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Usuário não autenticado",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const filterType = searchParams.get("filterType") || "month";

    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const startMonth = searchParams.get("startMonth");
    const endMonth = searchParams.get("endMonth");

    let filtroMesAno: any = {};
    let dataInicio: Date;
    let dataFim: Date;

    // =========================
    // FILTRO MENSAL
    // =========================

    if (filterType === "month" && month) {
      const [ano, mes] = month.split("-").map(Number);

      dataInicio = new Date(Date.UTC(ano, mes - 1, 1));
      dataFim = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));

      filtroMesAno = {
        $eq: dataInicio,
      };
    }

    // =========================
    // FILTRO ANUAL
    // =========================

    else if (filterType === "year" && year) {
      dataInicio = new Date(Date.UTC(Number(year), 0, 1));

      dataFim = new Date(
        Date.UTC(Number(year), 11, 31, 23, 59, 59, 999)
      );

      filtroMesAno = {
        $gte: dataInicio,
        $lte: dataFim,
      };
    }

    // =========================
    // FILTRO PERÍODO
    // =========================

    else if (
      filterType === "day" &&
      startMonth &&
      endMonth
    ) {
      const [anoInicio, mesInicio] =
        startMonth.split("-").map(Number);

      const [anoFim, mesFim] =
        endMonth.split("-").map(Number);

      dataInicio = new Date(
        Date.UTC(anoInicio, mesInicio - 1, 1)
      );

      dataFim = new Date(
        Date.UTC(
          anoFim,
          mesFim - 1,
          new Date(
            Date.UTC(anoFim, mesFim, 0)
          ).getUTCDate(),
          23,
          59,
          59,
          999
        )
      );

      filtroMesAno = {
        $gte: dataInicio,
        $lte: dataFim,
      };
    }

    // =========================
    // PADRÃO
    // =========================

    else {
      dataFim = new Date();

      dataInicio = new Date();
      dataInicio.setMonth(dataInicio.getMonth() - 6);

      filtroMesAno = {
        $gte: dataInicio,
        $lte: dataFim,
      };
    }

    // =========================
    // BUSCA DADOS
    // =========================

    const query = {
      userId: session.user.id,
      mesAno: filtroMesAno,
    };

    console.log("Filtro utilizado:");
    console.log(JSON.stringify(query, null, 2));

    const receitas_previstas =
      await ReceitaPrevista.find(query);

    const receitas_realizadas =
      await ReceitaRealizada.find(query);

    const despesas_previstas =
      await DespesaPrevista.find(query);

    console.log(
      receitas_previstas.map((r) => ({
        id: r._id,
        valor: r.valor,
        mesAno: r.mesAno,
        mesFormatado: getMesAnoFormatted(r.mesAno),
      }))
    );

    console.log(
      "TOTAL RECEITA PREVISTA:",
      receitas_previstas.reduce((s, r) => s + Number(r.valor), 0)
    );

    // =========================
    // TOTAIS
    // =========================

    const totalReceitaPrevista =
      receitas_previstas.reduce(
        (acc, r) => acc + r.valor,
        0
      );

    const totalReceitaRealizada =
      receitas_realizadas.reduce(
        (acc, r) => acc + r.valor,
        0
      );

    const totalDespesaPrevista =
      despesas_previstas.reduce(
        (acc, d) => acc + d.valor,
        0
      );

    const totalDespesaPaga = despesas_previstas
      .filter((d) => d.valorPago)
      .reduce(
        (acc, d) => acc + (d.valorPago || 0),
        0
      );

    // =========================
    // GRÁFICO
    // =========================

    const dadosPorMes: Record<string, any> = {};

    const initMes = (mesAno: string) => {
      if (!dadosPorMes[mesAno]) {
        dadosPorMes[mesAno] = {
          mes: mesAno,
          receitaPrevista: 0,
          receitaRealizada: 0,
          despesaPrevista: 0,
          despesaPaga: 0,
        };
      }
    };

    receitas_previstas.forEach((r) => {
      const mesAno = getMesAnoFormatted(r.mesAno);

      initMes(mesAno);

      dadosPorMes[mesAno].receitaPrevista += r.valor;
    });

    receitas_realizadas.forEach((r) => {
      const mesAno = getMesAnoFormatted(r.mesAno);

      initMes(mesAno);

      dadosPorMes[mesAno].receitaRealizada += r.valor;
    });

    despesas_previstas.forEach((d) => {
      const mesAno = getMesAnoFormatted(d.mesAno);

      initMes(mesAno);

      dadosPorMes[mesAno].despesaPrevista += d.valor;

      if (d.valorPago) {
        dadosPorMes[mesAno].despesaPaga += d.valorPago;
      }
    });

    const dadosGraficoMes = Object.values(
      dadosPorMes
    ).sort((a, b) => a.mes.localeCompare(b.mes));

    // =========================
    // MESES DISPONÍVEIS
    // =========================

    const receitasPrevistasMeses =
      await ReceitaPrevista.distinct(
        "mesAno",
        { userId: session.user.id }
      );

    const receitasRealizadasMeses =
      await ReceitaRealizada.distinct(
        "mesAno",
        { userId: session.user.id }
      );

    const despesasPrevistasMeses =
      await DespesaPrevista.distinct(
        "mesAno",
        { userId: session.user.id }
      );

    const mesesDisponiveis = [
      ...new Set(
        [
          ...receitasPrevistasMeses,
          ...receitasRealizadasMeses,
          ...despesasPrevistasMeses,
        ]
          .filter(Boolean)
          .map((data) => {
            if (typeof data === "string") {
              const [ano, mes] = data.split("-");
              return `${ano}-${String(mes).padStart(2, "0")}`;
            }

            return getMesAnoFormatted(new Date(data));
          })
      ),
    ].sort((a, b) => b.localeCompare(a));

    // =========================
    // CATEGORIAS
    // =========================

    const gastosPorCategoria: Record<string, number> = {};
    const receitasPorCategoria: Record<string, number> = {};
    const metodosPagamento: Record<string, number> = {};

    despesas_previstas.forEach((d) => {
      gastosPorCategoria[d.categoria] =
        (gastosPorCategoria[d.categoria] || 0) +
        d.valor;

      metodosPagamento[d.formaPagamento] =
        (metodosPagamento[d.formaPagamento] || 0) +
        d.valor;
    });

    receitas_previstas.forEach((r) => {
      receitasPorCategoria[r.categoria] =
        (receitasPorCategoria[r.categoria] || 0) +
        r.valor;
    });

    const dadosCategoria = Object.entries(
      gastosPorCategoria
    ).map(([name, value]) => ({ name, value }));

    const dadosReceitasCategoria = Object.entries(
      receitasPorCategoria
    ).map(([name, value]) => ({ name, value }));

    const dadosMetodos = Object.entries(
      metodosPagamento
    ).map(([name, value]) => ({ name, value }));

    const topCategorias = [...dadosCategoria]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return NextResponse.json(
      {
        success: true,

        mesesDisponiveis,

        resumo: {
          totalReceitaPrevista,
          totalReceitaRealizada,
          totalDespesaPrevista,
          totalDespesaPaga,
          saldoEstimado:
            totalReceitaPrevista -
            totalDespesaPrevista,
          saldoRealizado:
            totalReceitaRealizada -
            totalDespesaPaga,
          periodo: {
            inicio: dataInicio,
            fim: dataFim,
            filterType,
          },
        },

        graficos: {
          receitaDespesaMes: dadosGraficoMes,
          gastosPorCategoria: dadosCategoria,
          receitasPorCategoria:
            dadosReceitasCategoria,
          metodosPagamento: dadosMetodos,
          topCategorias,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro no dashboard:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Erro ao buscar dados do dashboard",
      },
      { status: 500 }
    );
  }
}