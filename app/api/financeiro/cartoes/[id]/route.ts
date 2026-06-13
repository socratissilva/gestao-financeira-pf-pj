import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Cartao from "@/models/cartao";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


// =========================
// GET
// =========================
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id } = await params;

        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Não autorizado" },
                { status: 401 }
            );
        }

        const cartao = await Cartao.findOne({
            _id: id,
            usuarioId: session.user.id,
            ativo: true,
        });

        if (!cartao) {
            return NextResponse.json(
                { message: "Cartão não encontrado" },
                { status: 404 }
            );
        }

        return NextResponse.json(cartao);
    } catch (error) {
        return NextResponse.json(
            { message: "Erro ao buscar cartão" },
            { status: 500 }
        );
    }
}

// =========================
// PUT
// =========================
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id } = await params;
        const body = await req.json();

        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Não autorizado" },
                { status: 401 }
            );
        }

        const cartao = await Cartao.findOneAndUpdate(
            {
                _id: id,
                usuarioId: session.user.id,
                ativo: true,
            },
            {
                nome: body.nome,
                vencimentoDia: body.vencimentoDia,
                limite: body.limite ?? null,
            },
            { new: true }
        );

        if (!cartao) {
            return NextResponse.json(
                { message: "Cartão não encontrado" },
                { status: 404 }
            );
        }

        return NextResponse.json(cartao);
    } catch (error) {
        return NextResponse.json(
            { message: "Erro ao atualizar cartão" },
            { status: 500 }
        );
    }
}

// =========================
// DELETE
// =========================
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id } = await params;

        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Não autorizado" },
                { status: 401 }
            );
        }

        const cartao = await Cartao.findOneAndUpdate(
            {
                _id: id,
                usuarioId: session.user.id,
                ativo: true,
            },
            { ativo: false },
            { new: true }
        );

        if (!cartao) {
            return NextResponse.json(
                { message: "Cartão não encontrado" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Cartão removido com sucesso",
        });
    } catch (error) {
        return NextResponse.json(
            { message: "Erro ao deletar cartão" },
            { status: 500 }
        );
    }
}