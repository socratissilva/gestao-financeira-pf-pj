import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AbastecimentoUber from "@/models/abastecimentoUber";
import mongoose from "mongoose";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    const abastecimento = await AbastecimentoUber.findById(id);

    if (!abastecimento) {
      return NextResponse.json(
        { success: false, error: "Registro não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      abastecimento,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erro ao buscar abastecimento" },
      { status: 500 }
    );
  }
}
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const abastecimento = await AbastecimentoUber.findByIdAndUpdate(
      id,
      {
        data: new Date(body.data),
        litros: Number(body.litros),
        km: Number(body.km),
        valor: Number(body.valor),
        preco: Number(body.preco),
        consumo: Number(body.consumo),
      },
      { new: true }
    );

    if (!abastecimento) {
      return NextResponse.json(
        { success: false, error: "Registro não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      abastecimento,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erro ao atualizar abastecimento" },
      { status: 500 }
    );
  }
}