import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import DespesaPrevista from "@/models/DespesaPrevista";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

/* =========================
   GET
========================= */
export async function GET(
    req: Request,
    context: {
        params: Promise<{ id: string }>;
    }
) {
    try {
        await connectDB();

        const session =
            await getServerSession(authOptions);

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

        const { id } = await context.params;

        const despesa =
            await DespesaPrevista.findOne({
                _id: id,
                userId: session.user.id,
            });

        if (!despesa) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Despesa não encontrada",
                },
                {
                    status: 404,
                }
            );
        }

        return NextResponse.json({
            success: true,
            despesa,
        });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Erro ao buscar despesa",
            },
            {
                status: 500,
            }
        );
    }
}

/* =========================
   PUT
========================= */
export async function PUT(
    req: Request,
    context: {
        params: Promise<{ id: string }>;
    }
) {
    try {
        await connectDB();

        const session =
            await getServerSession(authOptions);

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
        } = body;

        const despesa =
            await DespesaPrevista.findOneAndUpdate(
                {
                    _id: id,
                    userId: session.user.id,
                },
                {
                    mesAno: new Date(
                        `${mesAno}-01`
                    ),

                    categoria,

                    valor: Number(valor),

                    dataVencimento:
                        dataVencimento
                            ? new Date(dataVencimento)
                            : null,

                    formaPagamento,

                    cartaoId:
                        formaPagamento === "CREDITO"
                            ? cartaoId
                            : null,

                    observacao,

                    recorrente,

                    mesAnoFim:
                        recorrente && mesAnoFim
                            ? new Date(
                                `${mesAnoFim}-01`
                            )
                            : null,
                },
                {
                    new: true,
                }
            );

        if (!despesa) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Despesa não encontrada",
                },
                {
                    status: 404,
                }
            );
        }

        return NextResponse.json({
            success: true,
            despesa,
        });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Erro ao atualizar despesa",
            },
            {
                status: 500,
            }
        );
    }
}

/* =========================
   DELETE
========================= */
export async function DELETE(
    req: Request,
    context: {
        params: Promise<{ id: string }>;
    }
) {
    try {
        await connectDB();

        const session =
            await getServerSession(authOptions);

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

        const { id } = await context.params;

        const despesa =
            await DespesaPrevista.findOneAndDelete({
                _id: id,
                userId: session.user.id,
            });

        if (!despesa) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Despesa não encontrada",
                },
                {
                    status: 404,
                }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Despesa excluída com sucesso",
        });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Erro ao excluir despesa",
            },
            {
                status: 500,
            }
        );
    }
}