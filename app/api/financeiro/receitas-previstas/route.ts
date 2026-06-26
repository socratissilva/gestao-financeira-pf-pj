//app/api/financeiro/receitas-previstas/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import ReceitaPrevista from "@/models/ReceitaPrevista";

export const runtime = "nodejs";

/* =========================
   GET
========================= */
export async function GET() {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Usuário não autenticado",
        },
        {
          status: 401,
        }
      );
    }

    const receitas_previstas = await ReceitaPrevista.find({
      userId: session.user.id,
    }).sort({
      mesAno: -1,
    });

    return NextResponse.json(
      {
        success: true,
        receitas_previstas,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao buscar receitas",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================
   POST
========================= */
/* =========================
   POST
========================= */
export async function POST(req: Request) {
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

    const body = await req.json();

    const {
      mesAno,
      categoria,
      valor,
      observacao,
      recorrente,
      mesAnoFim,
    } = body;

    const documentos = [];

    const dataInicial = new Date(mesAno);

    if (recorrente && mesAnoFim) {
      const dataFinal = new Date(mesAnoFim);

      const dataAtual = new Date(dataInicial);

      while (dataAtual <= dataFinal) {
        documentos.push({
          userId: session.user.id,

          mesAno: new Date(
            Date.UTC(
              dataAtual.getUTCFullYear(),
              dataAtual.getUTCMonth(),
              1
            )
          ),

          categoria,

          valor: Number(valor),

          valorRecebido: null,

          observacao: observacao || "",

          recorrente: true,

          mesAnoFim: new Date(mesAnoFim),
        });

        dataAtual.setUTCMonth(dataAtual.getUTCMonth() + 1);
      }
    } else {
      documentos.push({
        userId: session.user.id,

        mesAno: new Date(mesAno),

        categoria,

        valor: Number(valor),

        valorRecebido: null,

        observacao: observacao || "",

        recorrente: false,

        mesAnoFim: null,
      });
    }

    const receitas = await ReceitaPrevista.insertMany(documentos);

    return NextResponse.json(
      {
        success: true,
        receitas,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao criar receita",
      },
      {
        status: 500,
      }
    );
  }
}