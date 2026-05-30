import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import GanhoUber from "@/models/ganhoUber";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;

    console.log("ID EXTRAÍDO:", id);

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID não recebido na rota" },
        { status: 400 }
      );
    }

    const ganho = await GanhoUber.findById(id);

    console.log("GANHO DO BANCO:", ganho);

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
/* ============================ */

export async function PUT(req: Request) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const id = url.pathname.split("/").pop(); // 🔥 pega o ID da rota

    const body = await req.json();

    console.log("ID EXTRAÍDO DA URL:", id);
    console.log("BODY:", body);

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID não recebido" },
        { status: 400 }
      );
    }

    const ganhoAtualizado = await GanhoUber.findByIdAndUpdate(
      id,
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

    return NextResponse.json({
      success: true,
      ganho: ganhoAtualizado,
    });

  } catch (error) {
    console.error("ERRO PUT:", error);

    return NextResponse.json(
      { success: false, message: "Erro ao atualizar ganho" },
      { status: 500 }
    );
  }
}