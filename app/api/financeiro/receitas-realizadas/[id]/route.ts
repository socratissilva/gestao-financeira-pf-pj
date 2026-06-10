import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ReceitaRealizada from "@/models/ReceitaRealizada";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

/* =====================================
   GET
===================================== */
export async function GET(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

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

        const receita =
            await ReceitaRealizada.findOne({
                _id: id,
                userId: session.user.id,
            });

        if (!receita) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Receita não encontrada",
                },
                {
                    status: 404,
                }
            );
        }

        return NextResponse.json({
            success: true,
            receita,
        });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Erro ao buscar receita",
            },
            {
                status: 500,
            }
        );
    }
}

/* =====================================
   PUT
===================================== */
export async function PUT(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

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

        const body = await req.json();

        const {
            mesAno,
            categoria,
            valor,
            observacao,
        } = body;

        const updated =
            await ReceitaRealizada.findOneAndUpdate(
                {
                    _id: id,
                    userId: session.user.id,
                },
                {
                    mesAno,
                    categoria,
                    valor: Number(valor),
                    observacao,
                },
                {
                    new: true,
                }
            );

        if (!updated) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Receita não encontrada",
                },
                {
                    status: 404,
                }
            );
        }

        return NextResponse.json({
            success: true,
            receita: updated,
        });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Erro ao atualizar receita",
            },
            {
                status: 500,
            }
        );
    }
}

/* =====================================
   DELETE
===================================== */
export async function DELETE(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

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

        const deleted =
            await ReceitaRealizada.findOneAndDelete({
                _id: id,
                userId: session.user.id,
            });

        if (!deleted) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Receita não encontrada",
                },
                {
                    status: 404,
                }
            );
        }

        return NextResponse.json({
            success: true,
            message:
                "Receita excluída com sucesso",
        });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message:
                    "Erro ao excluir receita",
            },
            {
                status: 500,
            }
        );
    }
}