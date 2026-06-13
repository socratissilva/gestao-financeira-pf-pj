import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Cartao from "@/models/cartao";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Não autorizado" },
                { status: 401 }
            );
        }

        await connectDB();

        const cartoes = await Cartao.find({
            usuarioId: session.user.id,
            ativo: true,
        }).sort({
            nome: 1,
        });

        return NextResponse.json(cartoes);
    } catch (error) {
        console.error("Erro ao buscar cartões:", error);

        return NextResponse.json(
            {
                error: "Não foi possível carregar os cartões.",
            },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Não autorizado" },
                { status: 401 }
            );
        }

        const body = await req.json();

        const nome = body.nome?.trim();
        const vencimentoDia = Number(body.vencimentoDia);
        const limite =
            body.limite !== null &&
            body.limite !== undefined &&
            body.limite !== ""
                ? Number(body.limite)
                : null;

        // Validações
        if (!nome) {
            return NextResponse.json(
                { error: "Informe o nome do cartão." },
                { status: 400 }
            );
        }

        if (
            !vencimentoDia ||
            vencimentoDia < 1 ||
            vencimentoDia > 31
        ) {
            return NextResponse.json(
                {
                    error:
                        "O dia de vencimento deve estar entre 1 e 31.",
                },
                { status: 400 }
            );
        }

        if (limite !== null && limite < 0) {
            return NextResponse.json(
                {
                    error:
                        "O limite não pode ser negativo.",
                },
                { status: 400 }
            );
        }

        await connectDB();

        // Evita duplicidade
        const cartaoExistente = await Cartao.findOne({
            usuarioId: session.user.id,
            nome: {
                $regex: `^${nome}$`,
                $options: "i",
            },
        });

        if (cartaoExistente) {
            return NextResponse.json(
                {
                    error: "Já existe um cartão com esse nome.",
                },
                { status: 400 }
            );
        }

        const cartao = await Cartao.create({
            usuarioId: session.user.id,
            nome,
            vencimentoDia,
            limite,
            ativo: true,
        });

        return NextResponse.json(
            {
                message: "Cartão criado com sucesso.",
                cartao,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Erro ao criar cartão:", error);

        return NextResponse.json(
            {
                error: "Erro interno ao criar cartão.",
            },
            { status: 500 }
        );
    }
}