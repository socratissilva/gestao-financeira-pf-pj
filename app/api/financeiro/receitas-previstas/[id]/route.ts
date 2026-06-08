import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ReceitaPrevista from "@/models/ReceitaPrevista";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Não autenticado" },
        { status: 401 }
      );
    }

    const receita = await ReceitaPrevista.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!receita) {
      return NextResponse.json(
        { success: false, message: "Não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      receita,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Erro ao buscar receita" },
      { status: 500 }
    );
  }
}
    export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

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
      categoria,
      valor,
      observacao,
      recorrente,
      mesAnoFim,
    } = body;

    const updated = await ReceitaPrevista.findOneAndUpdate(
      {
        _id: id,
        userId: session.user.id,
      },
      {
        mesAno,
        categoria,
        valor: Number(valor),
        observacao,
        recorrente,
        mesAnoFim: recorrente ? mesAnoFim : null,
      },
      {
        new: true,
      }
    );

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          message: "Não encontrada",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      receita: updated,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao atualizar",
      },
      {
        status: 500,
      }
    );
  }
}