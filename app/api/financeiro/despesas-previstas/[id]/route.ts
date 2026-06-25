// api/financeiro/despesas-previstas/[id]/route.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import DespesaPrevista from "@/models/DespesaPrevista";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import "@/models/cartao";

export const runtime = "nodejs";

/* =========================
   GET
========================= */
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
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

        const despesa = await DespesaPrevista.findOne({
            _id: id,
            userId: session.user.id,
        });

        if (!despesa) {
            return NextResponse.json(
                { success: false, message: "Despesa não encontrada" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            despesa,
        });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { success: false, message: "Erro ao buscar despesa" },
            { status: 500 }
        );
    }
}

/* =========================
   PUT
========================= */
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

        const {
            mesAno,
            categoria,
            valor,
            dataVencimento,
            formaPagamento,
            cartaoId,
            observacao,
            recorrente,
            mesAnoFim,
            valorPago,
            dataPagamento,
        } = body;

        /* =========================
           VALORES BASE
        ========================= */
        const valorDespesa = Number(valor || 0);

        const novoValorPago =
            valorPago !== null &&
            valorPago !== undefined &&
            valorPago !== ""
                ? Number(valorPago)
                : 0;

        const restante = valorDespesa - novoValorPago;

        const status =
            restante <= 0
                ? "pago"
                : novoValorPago > 0
                    ? "parcial"
                    : "pendente";

        /* =========================
           UTC SAFE DATE (VENCIMENTO)
        ========================= */
        let vencimentoDate = null;

        if (dataVencimento) {
            const [y, m, d] = dataVencimento.split("-");

            vencimentoDate = new Date(Date.UTC(
                Number(y),
                Number(m) - 1,
                Number(d)
            ));
        }

        /* =========================
           UPDATE
        ========================= */
        const despesa = await DespesaPrevista.findOneAndUpdate(
            {
                _id: id,
                userId: session.user.id,
            },
            {
                mesAno: new Date(`${mesAno}-01`),

                categoria,

                valor: valorDespesa,

                dataVencimento: vencimentoDate,

                formaPagamento,

                cartaoId: formaPagamento === "CREDITO" ? cartaoId : null,

                observacao,

                recorrente,

                mesAnoFim:
                    recorrente && mesAnoFim
                        ? new Date(`${mesAnoFim}-01`)
                        : null,

                valorPago:
                    novoValorPago > 0 ? novoValorPago : null,

                dataPagamento:
                    novoValorPago > 0
                        ? dataPagamento
                            ? new Date(`${dataPagamento}T00:00:00Z`)
                            : new Date()
                        : null,

                status,
            },
            { new: true }
        );

        if (!despesa) {
            return NextResponse.json(
                { success: false, message: "Despesa não encontrada" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            despesa,
        });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { success: false, message: "Erro ao atualizar despesa" },
            { status: 500 }
        );
    }
}

/* =========================
   DELETE
========================= */
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
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

        const despesa = await DespesaPrevista.findOneAndDelete({
            _id: id,
            userId: session.user.id,
        });

        if (!despesa) {
            return NextResponse.json(
                { success: false, message: "Despesa não encontrada" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Despesa excluída com sucesso",
        });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { success: false, message: "Erro ao excluir despesa" },
            { status: 500 }
        );
    }
}