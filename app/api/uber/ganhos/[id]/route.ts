import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import GanhoUber from "@/models/ganhoUber";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Não autenticado" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "ID inválido" },
        { status: 400 }
      );
    }

    const ganho = await GanhoUber.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!ganho) {
      return NextResponse.json(
        { success: false, message: "Ganho não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ganho,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Erro ao buscar ganho" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Não autenticado" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();

    const ganhoAtualizado = await GanhoUber.findOneAndUpdate(
      {
        _id: id,
        userId: session.user.id,
      },
      {
        data: body.data,
        plataforma: body.plataforma,
        valorBruto: body.valorBruto,
        horasTrabalhadas: body.horasTrabalhadas,
        kmRodados: body.kmRodados,
        observacao: body.observacao,
      },
      { new: true }
    );

    if (!ganhoAtualizado) {
      return NextResponse.json(
        { success: false, message: "Ganho não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ganho: ganhoAtualizado,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Erro ao atualizar ganho" },
      { status: 500 }
    );
  }
}