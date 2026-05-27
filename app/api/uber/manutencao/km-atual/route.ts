import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ConfiguracaoUber from "@/models/configuracaoUber";

export async function GET() {
    try {
        await connectDB();

        const config =
            await ConfiguracaoUber.findOne();

        return NextResponse.json({
            success: true,
            kmAtualVeiculo:
                config?.kmAtualVeiculo || 0,
        });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Erro ao buscar KM",
            },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();

        const body = await req.json();

        await ConfiguracaoUber.findOneAndUpdate(
            {},
            {
                kmAtualVeiculo:
                    Number(body.kmAtualVeiculo),
            },
            {
                upsert: true,
                new: true,
            }
        );

        return NextResponse.json({
            success: true,
        });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Erro ao salvar KM",
            },
            { status: 500 }
        );
    }
}