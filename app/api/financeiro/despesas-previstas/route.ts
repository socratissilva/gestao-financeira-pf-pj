// app/api/financeiro/despesas-previstas/route.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import DespesaPrevista from "@/models/DespesaPrevista";
import "@/models/cartao";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    const body = await req.json();

    const {
      mesAno,
      categoria,
      valor,
      dataVencimento,
      formaPagamento,
      cartaoId,
      observacao,
      recorrente,
      mesAnoFim,
    } = body;

    const despesa =
      await DespesaPrevista.create({
        userId: session.user.id,

        mesAno: new Date(
          `${mesAno}-01`
        ),

        categoria,

        valor: Number(valor),

        dataVencimento:
          dataVencimento
            ? new Date(dataVencimento)
            : null,

        formaPagamento,

        cartaoId:
          formaPagamento === "CREDITO"
            ? String(cartaoId)
            : null,

        observacao,

        recorrente,

        mesAnoFim:
          recorrente &&
            mesAnoFim
            ? new Date(
              `${mesAnoFim}-01`
            )
            : null,

        ativa: true,
      });

    return NextResponse.json({
      success: true,
      despesa,
    });

  } catch (error) {
    console.error(
      "Erro ao cadastrar despesa:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Erro ao cadastrar despesa",
      },
      {
        status: 500,
      }
    );
  }
}