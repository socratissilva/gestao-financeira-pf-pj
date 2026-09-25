import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Aporte, { APORTE_MONTHS, AporteMonth } from "@/models/Aporte";

export const runtime = "nodejs";

function isValidYear(value: number) {
  return Number.isInteger(value) && value >= 1900 && value <= 2100;
}

function isAporteMonth(value: string): value is AporteMonth {
  return APORTE_MONTHS.includes(value as AporteMonth);
}

function emptyMonths() {
  return Object.fromEntries(APORTE_MONTHS.map((month) => [month, 0]));
}

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUser();

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const yearParam = new URL(request.url).searchParams.get("ano");
    const ano = Number(yearParam);

    if (!isValidYear(ano)) {
      return NextResponse.json({ error: "Ano inválido" }, { status: 400 });
    }

    await connectDB();
    const aporte = await Aporte.findOne({ userId, ano }).lean();

    return NextResponse.json({
      success: true,
      ano,
      meses: { ...emptyMonths(), ...(aporte?.meses ?? {}) },
    });
  } catch (error) {
    console.error("Erro ao buscar aportes:", error);
    return NextResponse.json({ error: "Erro ao buscar aportes" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getAuthenticatedUser();

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const ano = Number(body.ano);
    const mes = String(body.mes ?? "");
    const valor = Number(body.valor);

    if (!isValidYear(ano)) {
      return NextResponse.json({ error: "Ano inválido" }, { status: 400 });
    }

    if (!isAporteMonth(mes)) {
      return NextResponse.json({ error: "Mês inválido" }, { status: 400 });
    }

    if (!Number.isFinite(valor) || valor < 0) {
      return NextResponse.json({ error: "O valor deve ser um número não negativo" }, { status: 400 });
    }

    await connectDB();
    const aporte = await Aporte.findOneAndUpdate(
      { userId, ano },
      {
        $set: { [`meses.${mes}`]: valor },
        $setOnInsert: { userId, ano },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json({
      success: true,
      ano,
      meses: { ...emptyMonths(), ...(aporte?.meses ?? {}) },
    });
  } catch (error) {
    console.error("Erro ao salvar aporte:", error);
    return NextResponse.json({ error: "Erro ao salvar aporte" }, { status: 500 });
  }
}