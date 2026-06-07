// api/financeiro/receitas_previstas/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ReceitaPrevista from "@/models/ReceitaPrevista";

export const runtime = "nodejs";

/* =========================
   GET - listar receitas
========================= */
export async function GET() {
    try {
        await connectDB();

        const receitas_previstas = await ReceitaPrevista.find().sort({ mesAno: -1 });

        return NextResponse.json(receitas_previstas, { status: 200 });
    } catch (error) {
        console.error("GET receitas error:", error);

        return NextResponse.json(
            { message: "Erro ao buscar receitas" },
            { status: 500 }
        );
    }
}

/* =========================
   POST - criar receita
========================= */
export async function POST(req: Request) {
    try {
        await connectDB();

        const body = await req.json();

        const { mesAno, categoria, valor, observacao, recorrente, mesAnoFim } =
            body;

        // 🔒 validações básicas
        if (!mesAno) {
            return NextResponse.json(
                { message: "mesAno é obrigatório" },
                { status: 400 }
            );
        }

        if (!categoria) {
            return NextResponse.json(
                { message: "categoria é obrigatória" },
                { status: 400 }
            );
        }

        if (!valor || Number(valor) <= 0) {
            return NextResponse.json(
                { message: "valor inválido" },
                { status: 400 }
            );
        }

        // 📌 criação
        const receita = await ReceitaPrevista.create({
            mesAno,
            categoria,
            valor: Number(valor),
            observacao: observacao || "",
            recorrente: !!recorrente,
            mesAnoFim: mesAnoFim || null,
        });

        return NextResponse.json(receita, { status: 201 });
    } catch (error) {
        console.error("POST receita error:", error);

        return NextResponse.json(
            { message: "Erro ao criar receita" },
            { status: 500 }
        );
    }
}