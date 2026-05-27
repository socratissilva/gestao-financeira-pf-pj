import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ManutencaoUber from "@/models/manutencaoUber";
import mongoose from "mongoose";

export async function GET(
  req: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    await connectDB();

    const { id } =
      await context.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "ID inválido",
        },
        { status: 400 }
      );
    }

    const manutencao =
      await ManutencaoUber.findById(id);

    if (!manutencao) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Manutenção não encontrada",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      manutencao,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Erro ao buscar manutenção",
      },
      { status: 500 }
    );
  }
}

/* =======================================================
   UPDATE
======================================================= */

export async function PUT(
  req: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    await connectDB();

    const { id } =
      await context.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "ID inválido",
        },
        { status: 400 }
      );
    }

    const body = await req.json();

    const manutencao =
      await ManutencaoUber.findByIdAndUpdate(
        id,
        {
          data: new Date(body.data),

          tipo: body.tipo,

          valor: Number(body.valor),

          km: Number(body.km),

          // NOVO CAMPO
          kmAtualVeiculo:
            Number(
              body.kmAtualVeiculo
            ) || 0,

          status:
            body.status ||
            "Concluída",

          proximaData:
            body.proximaData
              ? new Date(
                  body.proximaData
                )
              : null,

          proximaKm:
            body.proximaKm
              ? Number(
                  body.proximaKm
                )
              : null,

          observacoes:
            body.observacoes || "",
        },
        {
          new: true,
        }
      );

    return NextResponse.json({
      success: true,
      manutencao,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Erro ao atualizar manutenção",
      },
      { status: 500 }
    );
  }
}