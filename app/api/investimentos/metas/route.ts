import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import EstudoMetaInvestimento from "@/models/EstudoMetaInvestimento";

export const runtime = "nodejs";

const GRUPOS = ["etfs", "fiis", "acoes"] as const;
type GrupoKey = (typeof GRUPOS)[number];

interface AtivoInput {
  ticker: string;
  percentual: number;
}

interface GrupoInput {
  percentual: number;
  ativos: AtivoInput[];
}

interface AtivoRendaFixaInput {
  nome: string;
  percentual: number;
}

interface EstudoInput {
  nome: string;
  rendaVariavelPercentual: number;
  rendaFixaPercentual: number;
  distribuicaoVariavel: Record<GrupoKey, GrupoInput>;
  distribuicaoRendaFixa: {
    ativos: AtivoRendaFixaInput[];
  };
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isPercentual(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function somaFechaCem(value: number) {
  return Math.abs(value - 100) < 0.011;
}

function validarEstudo(body: unknown): { value?: EstudoInput; error?: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Dados do estudo inválidos." };
  }

  const input = body as Record<string, unknown>;
  const nome = typeof input.nome === "string" ? input.nome.trim() : "";
  const rendaVariavelPercentual = input.rendaVariavelPercentual;
  const rendaFixaPercentual = input.rendaFixaPercentual;
  const groups = input.distribuicaoVariavel;
  const fixedIncome = input.distribuicaoRendaFixa;

  if (!nome || nome.length > 80) {
    return { error: "Informe um nome para o estudo (máximo 80 caracteres)." };
  }
  if (!isPercentual(rendaVariavelPercentual)) {
    return { error: "O percentual de renda variável deve estar entre 0 e 100." };
  }
  if (!isPercentual(rendaFixaPercentual) || !somaFechaCem(rendaVariavelPercentual + rendaFixaPercentual)) {
    return { error: "Os percentuais de renda variável e renda fixa devem totalizar 100%." };
  }
  if (!groups || typeof groups !== "object" || Array.isArray(groups)) {
    return { error: "Informe a distribuição da renda variável." };
  }
  if (!fixedIncome || typeof fixedIncome !== "object" || Array.isArray(fixedIncome)) {
    return { error: "Informe a distribuição da renda fixa." };
  }

  const distribuicaoVariavel = {} as Record<GrupoKey, GrupoInput>;
  let totalGrupos = 0;

  for (const key of GRUPOS) {
    const group = (groups as Record<string, unknown>)[key];
    if (!group || typeof group !== "object" || Array.isArray(group)) {
      return { error: "A distribuição deve incluir ETFs, FIIs e ações." };
    }

    const groupInput = group as Record<string, unknown>;
    const percentual = groupInput.percentual;
    const assets = groupInput.ativos;
    if (!isPercentual(percentual) || !Array.isArray(assets) || assets.length < 1 || assets.length > 100) {
      return { error: "Confira os percentuais e os ativos de cada categoria." };
    }

    const ativos: AtivoInput[] = [];
    let totalAtivos = 0;
    for (const asset of assets) {
      if (!asset || typeof asset !== "object" || Array.isArray(asset)) {
        return { error: "Um dos ativos informados é inválido." };
      }

      const assetInput = asset as Record<string, unknown>;
      const ticker = typeof assetInput.ticker === "string" ? assetInput.ticker.trim().toUpperCase() : "";
      const assetPercentual = assetInput.percentual;
      if (!isPercentual(assetPercentual)) {
        return { error: "O percentual de cada ativo deve estar entre 0 e 100." };
      }
      if (ticker && !/^[A-Z0-9.^=+-]{1,20}$/.test(ticker)) {
        return { error: `O ticker "${ticker}" é inválido.` };
      }
      if (percentual > 0 && assetPercentual > 0 && !ticker) {
        return { error: "Informe o ticker de cada ativo com percentual maior que zero." };
      }

      ativos.push({ ticker, percentual: assetPercentual });
      totalAtivos += assetPercentual;
    }

    if (!somaFechaCem(totalAtivos)) {
      return { error: "Os percentuais dos ativos de cada categoria devem totalizar 100%." };
    }

    distribuicaoVariavel[key] = { percentual, ativos };
    totalGrupos += percentual;
  }

  if (!somaFechaCem(totalGrupos)) {
    return { error: "A divisão entre ETFs, FIIs e ações deve totalizar 100% da renda variável." };
  }

  const fixedIncomeAssets = (fixedIncome as Record<string, unknown>).ativos;
  if (!Array.isArray(fixedIncomeAssets) || fixedIncomeAssets.length < 1 || fixedIncomeAssets.length > 100) {
    return { error: "Informe ao menos um ativo para a renda fixa." };
  }

  const rendaFixaAtivos: AtivoRendaFixaInput[] = [];
  let totalRendaFixaAtivos = 0;
  for (const asset of fixedIncomeAssets) {
    if (!asset || typeof asset !== "object" || Array.isArray(asset)) {
      return { error: "Um dos ativos de renda fixa informados é inválido." };
    }

    const assetInput = asset as Record<string, unknown>;
    const assetName = typeof assetInput.nome === "string" ? assetInput.nome.trim() : "";
    const assetPercentual = assetInput.percentual;
    if (!isPercentual(assetPercentual)) {
      return { error: "O percentual de cada ativo de renda fixa deve estar entre 0 e 100." };
    }
    if (rendaFixaPercentual > 0 && assetPercentual > 0 && !assetName) {
      return { error: "Informe o nome de cada ativo de renda fixa com percentual maior que zero." };
    }
    if (assetName.length > 80) {
      return { error: "O nome de cada ativo de renda fixa deve ter no máximo 80 caracteres." };
    }

    rendaFixaAtivos.push({ nome: assetName, percentual: assetPercentual });
    totalRendaFixaAtivos += assetPercentual;
  }
  if (!somaFechaCem(totalRendaFixaAtivos)) {
    return { error: "Os percentuais dos ativos de renda fixa devem totalizar 100%." };
  }

  return {
    value: {
      nome,
      rendaVariavelPercentual,
      rendaFixaPercentual,
      distribuicaoVariavel,
      distribuicaoRendaFixa: { ativos: rendaFixaAtivos },
    },
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return jsonError("Não autorizado.", 401);

    await connectDB();
    const studies = await EstudoMetaInvestimento.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      estudos: studies.map((study) => ({
        id: study._id.toString(),
        nome: study.nome,
        rendaVariavelPercentual: study.rendaVariavelPercentual,
        rendaFixaPercentual: study.rendaFixaPercentual ?? 100 - study.rendaVariavelPercentual,
        distribuicaoVariavel: study.distribuicaoVariavel,
        distribuicaoRendaFixa: study.distribuicaoRendaFixa ?? {
          ativos: [{ nome: "Renda fixa", percentual: 100 }],
        },
        createdAt: study.createdAt,
      })),
    });
  } catch (error) {
    console.error("Erro ao carregar metas de investimento:", error);
    return jsonError("Não foi possível carregar os estudos de metas.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return jsonError("Não autorizado.", 401);

    const validation = validarEstudo(await request.json());
    if (!validation.value) return jsonError(validation.error ?? "Estudo inválido.", 400);

    await connectDB();
    const study = await EstudoMetaInvestimento.create({
      ...validation.value,
      userId: session.user.id,
    });

    return NextResponse.json(
      {
        id: study._id.toString(),
        ...validation.value,
        createdAt: study.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao salvar meta de investimento:", error);
    return jsonError("Não foi possível salvar o estudo.", 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return jsonError("Não autorizado.", 401);

    const id = new URL(request.url).searchParams.get("id");
    if (!id || !Types.ObjectId.isValid(id)) return jsonError("Estudo inválido.", 400);

    await connectDB();
    const result = await EstudoMetaInvestimento.deleteOne({ _id: id, userId: session.user.id });
    if (result.deletedCount === 0) return jsonError("Estudo não encontrado.", 404);

    return NextResponse.json({ sucesso: true });
  } catch (error) {
    console.error("Erro ao excluir meta de investimento:", error);
    return jsonError("Não foi possível excluir o estudo.", 500);
  }
}
