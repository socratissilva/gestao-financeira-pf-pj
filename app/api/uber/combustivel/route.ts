import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import AbastecimentoUber from "@/models/abastecimentoUber";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    // Calcular preço unitário e consumo
    const litros = Number(body.litros);
    const valor = Number(body.valor);
    const km = Number(body.km);

    const precoUnitario = (valor / litros).toFixed(2);
    const consumoMedio = (km / litros).toFixed(1);

    const abastecimento = await AbastecimentoUber.create({
      ...body,
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

    const abastecimentos = await AbastecimentoUber.find().sort({
      data: -1,
    });

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
