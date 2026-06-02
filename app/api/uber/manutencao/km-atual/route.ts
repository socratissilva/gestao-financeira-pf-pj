//app/api/uber/manutencao/km-atual/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ConfiguracaoUber from "@/models/configuracaoUber";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


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

    const config = await ConfiguracaoUber.findOne({
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      kmAtualVeiculo: config?.kmAtualVeiculo || 0,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao buscar KM",
      },
      { status: 500 }
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

    await ConfiguracaoUber.findOneAndUpdate(
      {
        userId: session.user.id,
      },
      {
        userId: session.user.id,
        kmAtualVeiculo: Number(body.kmAtualVeiculo),
      },
      {
        upsert: true,
        new: true,
      }
    );

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao salvar KM",
      },
      { status: 500 }
    );
  }
}