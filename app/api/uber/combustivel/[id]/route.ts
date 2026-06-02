import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AbastecimentoUber from "@/models/abastecimentoUber";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Não autenticado",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    const abastecimento =
      await AbastecimentoUber.findOne({
        _id: id,
        userId: session.user.id,
      });

    if (!abastecimento) {
      return NextResponse.json(
        {
          success: false,
          error: "Registro não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      abastecimento,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar abastecimento",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Não autenticado",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const litros = Number(body.litros);
    const valor = Number(body.valor);
    const km = Number(body.km);

    const precoUnitario = (valor / litros).toFixed(2);
    const consumoMedio = (km / litros).toFixed(1);

    const abastecimento =
      await AbastecimentoUber.findOneAndUpdate(
        {
          _id: id,
          userId: session.user.id,
        },
        {
          data: new Date(body.data),
          litros,
          km,
          valor,

          preco: `R$ ${precoUnitario}/L`,
          consumo: `${consumoMedio} km/L`,
        },
        {
          new: true,
        }
      );

    if (!abastecimento) {
      return NextResponse.json(
        {
          success: false,
          error: "Registro não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      abastecimento,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao atualizar abastecimento",
      },
      {
        status: 500,
      }
    );
  }
}