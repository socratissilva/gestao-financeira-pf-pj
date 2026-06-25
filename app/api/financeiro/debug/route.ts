import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import DespesaPrevista from "@/models/DespesaPrevista";
import ReceitaPrevista from "@/models/ReceitaPrevista";
import ReceitaRealizada from "@/models/ReceitaRealizada";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

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

    const userId = session.user.id;

    // Contar registros
    const despesasCount = await DespesaPrevista.countDocuments({ userId });
    const receitasCount = await ReceitaPrevista.countDocuments({ userId });
    const receitasRealizadasCount = await ReceitaRealizada.countDocuments({ userId });

    // Listar TODOS os registros
    const despesas = await DespesaPrevista.find({ userId }).select('mesAno categoria valor');
    const receitas = await ReceitaPrevista.find({ userId }).select('mesAno categoria valor');
    const receitasRealizadas = await ReceitaRealizada.find({ userId }).select('mesAno categoria valor');

    return NextResponse.json(
      {
        contagemTotal: {
          despesasPrevisas: despesasCount,
          receitasPrevisas: receitasCount,
          receitasRealizadas: receitasRealizadasCount,
        },
        despesasDetalhes: despesas.map(d => ({
          mes: d.mesAno?.toISOString().slice(0, 7),
          categoria: d.categoria,
          valor: d.valor
        })),
        receitasDetalhes: receitas.map(r => ({
          mes: r.mesAno?.toISOString().slice(0, 7),
          categoria: r.categoria,
          valor: r.valor
        })),
        receitasRealizadasDetalhes: receitasRealizadas.map(r => ({
          mes: r.mesAno?.toISOString().slice(0, 7),
          categoria: r.categoria,
          valor: r.valor
        }))
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Erro ao verificar dados:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao verificar dados" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Não autenticado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Deletar TODOS os dados
    const despesasDeleted = await DespesaPrevista.deleteMany({ userId });
    const receitasDeleted = await ReceitaPrevista.deleteMany({ userId });
    const receitasRealizadasDeleted = await ReceitaRealizada.deleteMany({ userId });

    return NextResponse.json(
      {
        success: true,
        message: "Todos os dados foram deletados",
        deletados: {
          despesas: despesasDeleted.deletedCount,
          receitas: receitasDeleted.deletedCount,
          receitasRealizadas: receitasRealizadasDeleted.deletedCount,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Erro ao deletar dados:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao deletar dados" },
      { status: 500 }
    );
  }
}
