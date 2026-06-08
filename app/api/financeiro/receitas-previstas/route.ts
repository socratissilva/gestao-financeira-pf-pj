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
      observacao,
      recorrente,
      mesAnoFim,
    } = body;

    const receita = await ReceitaPrevista.create({
      mesAno,
      categoria,
      valor: Number(valor),
      observacao: observacao || "",
      recorrente: !!recorrente,
      mesAnoFim: mesAnoFim || null,

      userId: session.user.id,
    });

    return NextResponse.json(
      {
        success: true,
        receita,
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