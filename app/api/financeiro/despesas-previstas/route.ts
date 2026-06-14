// app/api/financeiro/despesas-previstas/route.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import DespesaPrevista from "@/models/DespesaPrevista";
import "@/models/cartao";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();

    const session =
      await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Não autenticado",
        },
        {
          status: 401,
        }
      );
    }

    const despesas_previstas =
      await DespesaPrevista.find({
        userId: session.user.id,
      })
        .populate("cartaoId")
        .sort({
          mesAno: -1,
        })
        .lean();

    return NextResponse.json({
      success: true,
      despesas_previstas,
    });

  } catch (error) {
    console.error(
      "Erro ao buscar despesas:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Erro ao buscar despesas",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);


    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      mesAno,
      mesAnoFim,
      recorrente,
      categoria,
      valor,
      dataVencimento,
      formaPagamento,
      cartaoId,
      observacao,
    } = body;

    // helper
    function gerarMeses(inicio: string, fim: string) {
      const meses: string[] = [];

      let [ano, mes] = inicio.split("-").map(Number);
      const [anoFim, mesFim] = fim.split("-").map(Number);

      while (ano < anoFim || (ano === anoFim && mes <= mesFim)) {
        meses.push(`${ano}-${String(mes).padStart(2, "0")}`);

        mes++;
        if (mes > 12) {
          mes = 1;
          ano++;
        }
      }

      return meses;
    }

    // 🔥 NÃO RECORRENTE
    if (!recorrente) {
      const despesa = await DespesaPrevista.create({
        userId: session.user.id,
        mesAno: new Date(`${mesAno}-01`),
        categoria,
        valor: Number(valor),
        dataVencimento: dataVencimento
          ? new Date(`${dataVencimento}T12:00:00`)
          : null,
        formaPagamento,
        cartaoId:
          formaPagamento === "CREDITO"
            ? new mongoose.Types.ObjectId(cartaoId)
            : null,
        observacao,
        recorrente: false,
        mesAnoFim: null,
        ativa: true,
      });

      return NextResponse.json({
        success: true,
        despesa,
      });
    }

    // 🔥 RECORRENTE (AQUI ESTAVA O BUG)
    const meses = gerarMeses(mesAno, mesAnoFim);

    const inserts = meses.map((m) => {
      const [ano, mes] = m.split("-").map(Number);

      let vencimentoFinal = null;

      if (dataVencimento) {
        const partes = dataVencimento.split("-");

        const dia = Number(partes[2]);

        vencimentoFinal = new Date(
          ano,
          mes - 1,
          dia,
          12,
          0,
          0
        );
      }

      return {
        userId: session.user.id,
        mesAno: new Date(`${m}-01`),
        categoria,
        valor: Number(valor),
        dataVencimento: vencimentoFinal, // ✅ agora correto por mês
        formaPagamento,
        cartaoId:
          formaPagamento === "CREDITO"
            ? new mongoose.Types.ObjectId(cartaoId)
            : null,
        observacao,
        recorrente: true,
        mesAnoFim: new Date(`${mesAnoFim}-01`),
        ativa: true,
      };
    });

    const despesa = await DespesaPrevista.insertMany(inserts);

    return NextResponse.json({
      success: true,
      despesa,
      totalCriados: despesa.length,
    });
  } catch (error) {
    console.error("Erro ao cadastrar despesa:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao cadastrar despesa",
      },
      { status: 500 }
    );
  }
}