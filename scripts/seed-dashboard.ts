import { connectDB } from "@/lib/mongodb";
import DespesaPrevista from "@/models/DespesaPrevista";
import ReceitaPrevista from "@/models/ReceitaPrevista";

const userId = "6a1a56486d3151b036f5a19b"; // ID do admin

async function seedData() {
  try {
    await connectDB();

    console.log("🌱 Começando a popular dados de teste...");

    // Limpar dados antigos
    await DespesaPrevista.deleteMany({ userId });
    await ReceitaPrevista.deleteMany({ userId });

    console.log("✓ Dados antigos removidos");

    // Criar despesas para os próximos 6 meses
    const despesas = [
      {
        mesAno: new Date(2026, 5, 1), // junho
        categoria: "Moradia",
        valor: 2000,
        formaPagamento: "PIX",
      },
      {
        mesAno: new Date(2026, 5, 1),
        categoria: "Alimentação",
        valor: 800,
        formaPagamento: "DINHEIRO",
      },
      {
        mesAno: new Date(2026, 5, 1),
        categoria: "Transporte",
        valor: 300,
        formaPagamento: "DEBITO",
      },
      {
        mesAno: new Date(2026, 6, 1), // julho
        categoria: "Moradia",
        valor: 2000,
        formaPagamento: "PIX",
      },
      {
        mesAno: new Date(2026, 6, 1),
        categoria: "Alimentação",
        valor: 900,
        formaPagamento: "DINHEIRO",
      },
      {
        mesAno: new Date(2026, 6, 1),
        categoria: "Saúde",
        valor: 500,
        formaPagamento: "CREDITO",
      },
      {
        mesAno: new Date(2026, 7, 1), // agosto
        categoria: "Moradia",
        valor: 2000,
        formaPagamento: "PIX",
      },
      {
        mesAno: new Date(2026, 7, 1),
        categoria: "Lazer",
        valor: 600,
        formaPagamento: "CREDITO",
      },
      {
        mesAno: new Date(2026, 8, 1), // setembro
        categoria: "Educação",
        valor: 1200,
        formaPagamento: "PIX",
      },
      {
        mesAno: new Date(2026, 9, 1), // outubro
        categoria: "Transporte",
        valor: 400,
        formaPagamento: "DINHEIRO",
      },
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
      {
        mesAno: new Date(2026, 5, 1), // junho
        categoria: "RENDA_1",
        valor: 5000,
      },
      {
        mesAno: new Date(2026, 5, 1),
        categoria: "TICKET",
        valor: 800,
      },
      {
        mesAno: new Date(2026, 6, 1), // julho
        categoria: "RENDA_1",
        valor: 5000,
      },
      {
        mesAno: new Date(2026, 6, 1),
        categoria: "TICKET",
        valor: 900,
      },
      {
        mesAno: new Date(2026, 7, 1), // agosto
        categoria: "RENDA_1",
        valor: 5000,
      },
      {
        mesAno: new Date(2026, 8, 1), // setembro
        categoria: "RENDA_1",
        valor: 5000,
      },
      {
        mesAno: new Date(2026, 9, 1), // outubro
        categoria: "RENDA_1",
        valor: 5000,
      },
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

    console.log("✅ Dados de teste criados com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao popular dados:", error);
    process.exit(1);
  }
}

seedData();
