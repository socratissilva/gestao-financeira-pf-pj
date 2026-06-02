
//app/api/uber/manutencao/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ManutencaoUber from "@/models/manutencaoUber";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    const manutencao = await ManutencaoUber.create({
      data: new Date(body.data),
      tipo: body.tipo,
      valor: Number(body.valor),
      km: Number(body.km),

      kmAtualVeiculo: Number(body.kmAtualVeiculo) || 0,
      status: body.status || "Concluída",

      proximaData: body.proximaData
        ? new Date(body.proximaData)
        : null,

      proximaKm: body.proximaKm
        ? Number(body.proximaKm)
        : null,

      observacoes: body.observacoes || "",

      // 🔐 IMPORTANTE
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      manutencao,
    });
  } catch (error: any) {
    console.error("ERRO AO SALVAR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Erro ao cadastrar manutenção",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Não autenticado" },
        { status: 401 }
      );
    }

    const manutencoes = await ManutencaoUber.find({
      userId: session.user.id,
    }).sort({ data: -1 });

    return NextResponse.json({
      success: true,
      manutencoes,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao buscar manutenções",
      },
      { status: 500 }
    );
  }
}