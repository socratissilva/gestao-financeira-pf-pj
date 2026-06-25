import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import DespesaPrevista from "@/models/DespesaPrevista";
import ReceitaPrevista from "@/models/ReceitaPrevista";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
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

    console.log("🌱 Começando a popular dados de teste para usuário:", userId);

    // Limpar dados antigos
    await DespesaPrevista.deleteMany({ userId });
    await ReceitaPrevista.deleteMany({ userId });

    console.log("✓ Dados antigos removidos");

    // Criar despesas para os próximos 6 meses
    const despesas = [
      { mesAno: new Date(2026, 5, 1), categoria: "Moradia", valor: 2000, formaPagamento: "PIX" },
      { mesAno: new Date(2026, 5, 1), categoria: "Alimentação", valor: 800, formaPagamento: "DINHEIRO" },
      { mesAno: new Date(2026, 5, 1), categoria: "Transporte", valor: 300, formaPagamento: "DEBITO" },
      { mesAno: new Date(2026, 6, 1), categoria: "Moradia", valor: 2000, formaPagamento: "PIX" },
      { mesAno: new Date(2026, 6, 1), categoria: "Alimentação", valor: 900, formaPagamento: "DINHEIRO" },
      { mesAno: new Date(2026, 6, 1), categoria: "Saúde", valor: 500, formaPagamento: "CREDITO" },
      { mesAno: new Date(2026, 7, 1), categoria: "Moradia", valor: 2000, formaPagamento: "PIX" },
      { mesAno: new Date(2026, 7, 1), categoria: "Lazer", valor: 600, formaPagamento: "CREDITO" },
      { mesAno: new Date(2026, 8, 1), categoria: "Educação", valor: 1200, formaPagamento: "PIX" },
      { mesAno: new Date(2026, 9, 1), categoria: "Transporte", valor: 400, formaPagamento: "DINHEIRO" },
    ];

    for (const despesa of despesas) {
      await DespesaPrevista.create({
        userId,
        mesAno: despesa.mesAno,
        categoria: despesa.categoria,
        valor: despesa.valor,
        formaPagamento: despesa.formaPagamento,
        ativa: true,
        recorrente: false,
      });
    }

    console.log("✓ 10 despesas criadas");

    // Criar receitas
    const receitas = [
      { mesAno: new Date(2026, 5, 1), categoria: "RENDA_1", valor: 5000 },
      { mesAno: new Date(2026, 5, 1), categoria: "TICKET", valor: 800 },
      { mesAno: new Date(2026, 6, 1), categoria: "RENDA_1", valor: 5000 },
      { mesAno: new Date(2026, 6, 1), categoria: "TICKET", valor: 900 },
      { mesAno: new Date(2026, 7, 1), categoria: "RENDA_1", valor: 5000 },
      { mesAno: new Date(2026, 8, 1), categoria: "RENDA_1", valor: 5000 },
      { mesAno: new Date(2026, 9, 1), categoria: "RENDA_1", valor: 5000 },
    ];

    for (const receita of receitas) {
      await ReceitaPrevista.create({
        userId,
        mesAno: receita.mesAno,
        categoria: receita.categoria,
        valor: receita.valor,
        observacao: "Teste",
        recorrente: false,
      });
    }

    console.log("✓ 7 receitas criadas");

    return NextResponse.json(
      {
        success: true,
        message: "Dados de teste criados com sucesso!",
        despesasCount: 10,
        receitasCount: 7,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Erro ao popular dados:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao criar dados de teste" },
      { status: 500 }
    );
  }
}
