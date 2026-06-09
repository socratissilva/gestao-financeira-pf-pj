import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import ReceitaRealizada from "@/models/ReceitaRealizada";

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

    const receitas_realizadas = await ReceitaRealizada.find({
      userId: session.user.id,
    }).sort({
      mesAno: -1,
    });

    return NextResponse.json(
      {
        success: true,
        receitas_realizadas,
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
    } = body;

    const receita = await ReceitaRealizada.create({
      mesAno,
      categoria,
      valor: Number(valor),
      observacao: observacao || "",
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