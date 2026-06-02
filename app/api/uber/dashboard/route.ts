import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

import GanhoUber from "@/models/ganhoUber";
import AbastecimentoUber from "@/models/abastecimentoUber";
import ManutencaoUber from "@/models/manutencaoUber";
import ConfiguracaoUber from "@/models/configuracaoUber";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

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

    const userId = session.user.id;

    const [
      ganhos,
      combustiveis,
      manutencoes,
      configuracao,
    ] = await Promise.all([
      GanhoUber.find({ userId }),
      AbastecimentoUber.find({ userId }),
      ManutencaoUber.find({ userId }),
      ConfiguracaoUber.findOne({ userId }),
    ]);

    return NextResponse.json({
      success: true,
      ganhos,
      combustiveis,
      manutencoes,
      kmAtual:
        configuracao?.kmAtualVeiculo || 0,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao carregar dashboard",
      },
      {
        status: 500,
      }
    );
  }
}