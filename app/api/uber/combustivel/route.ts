import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import AbastecimentoUber from "@/models/abastecimentoUber";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export async function POST(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Usuário não autenticado",
        },
        {
          status: 401,
        }
      );
    }

    const body = await req.json();

    const litros = Number(body.litros);
    const valor = Number(body.valor);
    const km = Number(body.km);

    const precoUnitario = (valor / litros).toFixed(2);
    const consumoMedio = (km / litros).toFixed(1);

    const abastecimento = await AbastecimentoUber.create({
      ...body,

      userId: session.user.id,

      preco: `R$ ${precoUnitario}/L`,
      consumo: `${consumoMedio} km/L`,
    });

    return NextResponse.json(
      {
        success: true,
        abastecimento,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao cadastrar abastecimento",
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET() {
  try {
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

    const abastecimentos =
      await AbastecimentoUber.find({
        userId: session.user.id,
      }).sort({ data: -1 });

    return NextResponse.json({
      success: true,
      abastecimentos,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao buscar abastecimentos",
      },
      {
        status: 500,
      }
    );
  }
}
