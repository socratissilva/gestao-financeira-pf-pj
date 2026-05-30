import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ManutencaoUber from "@/models/manutencaoUber";
import mongoose from "mongoose";

/* =======================================================
   REGRAS
======================================================= */

const REGRAS_MANUTENCAO: Record<
  string,
  { meses: number; km: number }
> = {
  "Troca de óleo": { meses: 6, km: 10000 },
  "Troca de pneus": { meses: 12, km: 40000 },
  "Alinhamento e balanceamento": { meses: 6, km: 10000 },
  Freios: { meses: 8, km: 20000 },
  Suspensão: { meses: 12, km: 30000 },
  "Ar-condicionado": { meses: 12, km: 15000 },
  Bateria: { meses: 24, km: 0 },
  Filtros: { meses: 6, km: 10000 },
  "Revisão geral": { meses: 12, km: 10000 },
  Outros: { meses: 6, km: 10000 },
};

/* =======================================================
   GET BY ID
======================================================= */

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "ID inválido" },
        { status: 400 }
      );
    }

    const manutencao = await ManutencaoUber.findById(id);

    if (!manutencao) {
      return NextResponse.json(
        { success: false, message: "Manutenção não encontrada" },
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
      { success: false, message: "Erro ao buscar manutenção" },
      { status: 500 }
    );
  }
}

/* =======================================================
   UPDATE
======================================================= */

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "ID inválido" },
        { status: 400 }
      );
    }

    const body = await req.json();

    /* ===================================================
       CALCULA PRÓXIMA MANUTENÇÃO
    =================================================== */

    const regra = REGRAS_MANUTENCAO[body.tipo];

    let proximaData: Date | null = null;
    let proximaKm: number | null = null;

    if (regra) {
      if (body.data) {
        const d = new Date(body.data);
        d.setMonth(d.getMonth() + regra.meses);
        proximaData = d;
      }

      if (body.km) {
        proximaKm = Number(body.km) + regra.km;
      }
    }

    /* ===================================================
       UPDATE BANCO
    =================================================== */

    const manutencao = await ManutencaoUber.findByIdAndUpdate(
      id,
      {
        data: new Date(body.data),
        tipo: body.tipo,
        valor: Number(body.valor),
        km: Number(body.km),
        status: body.status || "Concluída",

        proximaData,
        proximaKm,

        observacoes: body.observacoes || "",
      },
      { new: true }
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
        message: error.message || "Erro ao atualizar manutenção",
      },
      { status: 500 }
    );
  }
}