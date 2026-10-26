import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import {
  calcularPosicoes,
  type OperacaoCarteira,
} from "@/lib/investimentos/calculoCarteira";
import {
  buscarCambioParaBRL,
  buscarCotacoes,
  type Cotacao,
} from "@/lib/investimentos/cotacoes";
import OperacaoInvestimento, {
  LADOS_OPERACAO,
  MOEDAS_INVESTIMENTO,
  TIPOS_ATIVO,
  type LadoOperacao,
  type MoedaInvestimento,
  type TipoAtivo,
} from "@/models/OperacaoInvestimento";
import PrecoManualInvestimento from "@/models/PrecoManualInvestimento";
import SnapshotPatrimonioInvestimento from "@/models/SnapshotPatrimonioInvestimento";

export const runtime = "nodejs";

interface Operacao extends OperacaoCarteira {
  _id: Types.ObjectId | string;
  createdAt?: Date;
}

function isOneOf<T extends readonly string[]>(value: unknown, options: T): value is T[number] {
  return typeof value === "string" && options.includes(value);
}

async function getUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return jsonError("Não autorizado.", 401);

    await connectDB();
    const [operationDocs, manualPrices] = await Promise.all([
      OperacaoInvestimento.find({ userId }).sort({ dataOperacao: 1, createdAt: 1 }).lean(),
      PrecoManualInvestimento.find({ userId }).lean(),
    ]);
    const operations = operationDocs as unknown as Operacao[];
    const { positions, lucroRealizadoBRL } = calcularPosicoes(operations);
    const manualByTicker = new Map(manualPrices.map((price) => [price.ticker, price]));
    const quoteInputs = positions
      .filter((position) => position.tipoAtivo !== "RENDA_FIXA")
      .map((position) => ({
        ticker: position.ticker,
        tipoAtivo: position.tipoAtivo,
        moeda: position.moeda,
      }));
    const [quotes, exchangeRates] = await Promise.all([
      buscarCotacoes(quoteInputs),
      buscarCambioParaBRL(positions.map((position) => position.moeda)),
    ]);

    const hydratedPositions = positions.map((position) => {
      const quote: Cotacao | undefined =
        position.tipoAtivo === "RENDA_FIXA"
          ? (() => {
              const manual = manualByTicker.get(position.ticker);
              return manual
                ? {
                    preco: manual.preco,
                    variacaoPercentual: null,
                    moeda: manual.moeda,
                    fonte: "Preço informado manualmente",
                    atualizadoEm: new Date(manual.atualizadoEm).toISOString(),
                    erro: null,
                  }
                : {
                    preco: null,
                    variacaoPercentual: null,
                    moeda: position.moeda,
                    fonte: "Preço informado manualmente",
                    atualizadoEm: null,
                    erro: "Informe o valor atual manualmente para esta posição de renda fixa.",
                  };
            })()
          : quotes.get(position.tipoAtivo === "CRIPTO" ? `CRIPTO:${position.ticker}` : position.ticker);
      const cambioAtual = exchangeRates.get(position.moeda);
      const quoteCurrencyMismatch =
        quote?.preco !== null &&
        quote?.preco !== undefined &&
        quote.moeda &&
        quote.moeda !== position.moeda;
      const quoteError =
        quote?.erro ??
        (quoteCurrencyMismatch
          ? `A cotação veio em ${quote?.moeda}, mas a operação está cadastrada em ${position.moeda}.`
          : null) ??
        (cambioAtual === undefined
          ? `Não foi possível obter o câmbio ${position.moeda}/BRL.`
          : null);
      const currentQuotePrice = quoteCurrencyMismatch ? null : quote?.preco ?? null;
      const marketValueBRL =
        currentQuotePrice !== null && cambioAtual !== undefined
          ? position.quantidade * currentQuotePrice * cambioAtual
          : null;
      const returnBRL = marketValueBRL === null ? null : marketValueBRL - position.custoBRL;

      return {
        ticker: position.ticker,
        nome: position.nome,
        tipoAtivo: position.tipoAtivo,
        setor: position.setor,
        moeda: position.moeda,
        quantidade: position.quantidade,
        precoMedio: position.quantidade > 0 ? position.custoNativo / position.quantidade : 0,
        precoAtual: currentQuotePrice,
        variacaoPercentual: quote?.variacaoPercentual ?? null,
        custoBRL: position.custoBRL,
        valorAtualBRL: marketValueBRL,
        resultadoBRL: returnBRL,
        rentabilidadePercentual:
          returnBRL !== null && position.custoBRL > 0 ? (returnBRL / position.custoBRL) * 100 : null,
        fonteCotacao: quote?.fonte ?? "Indisponível",
        cotacaoAtualizadaEm: quote?.atualizadoEm ?? null,
        erroCotacao: quoteError,
        cotacaoManual: position.tipoAtivo === "RENDA_FIXA",
      };
    });

    const valuationComplete = hydratedPositions.every((position) => position.valorAtualBRL !== null);
    const valuationPartial = hydratedPositions.some((position) => position.valorAtualBRL !== null);
    const valorCotadoBRL = hydratedPositions.reduce(
      (total, position) => total + (position.valorAtualBRL ?? 0),
      0
    );
    const valorAtualBRL = valuationComplete ? valorCotadoBRL : null;
    const totalInvestidoBRL = positions.reduce((total, position) => total + position.custoBRL, 0);
    const dateKey = new Date().toISOString().slice(0, 10);
    const porClasseSnapshot = TIPOS_ATIVO.flatMap((tipoAtivo) => {
      const classPositions = hydratedPositions.filter(
        (position) => position.tipoAtivo === tipoAtivo
      );
      if (classPositions.length === 0) return [];

      const valuationComplete = classPositions.every(
        (position) => position.valorAtualBRL !== null
      );
      return [{
        tipoAtivo,
        investidoBRL: classPositions.reduce(
          (total, position) => total + position.custoBRL,
          0
        ),
        valorAtualBRL: valuationComplete
          ? classPositions.reduce(
              (total, position) => total + (position.valorAtualBRL ?? 0),
              0
            )
          : null,
      }];
    });

    await SnapshotPatrimonioInvestimento.updateOne(
      { userId, dateKey },
      {
        $set: {
          userId,
          dateKey,
          valuationComplete,
          porClasse: porClasseSnapshot,
        },
      },
      { upsert: true }
    );
    const snapshots = await SnapshotPatrimonioInvestimento.find({ userId })
      .sort({ dateKey: 1 })
      .lean();

    function groupBy<T extends { valorAtualBRL: number | null }>(
      key: (position: (typeof hydratedPositions)[number]) => string
    ) {
      const groups = new Map<string, number>();
      for (const position of hydratedPositions) {
        if (position.valorAtualBRL === null) continue;
        const name = key(position);
        groups.set(name, (groups.get(name) ?? 0) + position.valorAtualBRL);
      }
      return [...groups.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    }

    return NextResponse.json({
      posicoes: hydratedPositions,
      operacoes: [...operations]
        .sort((a, b) => new Date(b.dataOperacao).getTime() - new Date(a.dataOperacao).getTime())
        .map((operation) => ({
          id: operation._id.toString(),
          ticker: operation.ticker,
          nome: operation.nome,
          tipoAtivo: operation.tipoAtivo,
          setor: operation.setor,
          lado: operation.lado,
          quantidade: operation.quantidade,
          precoUnitario: operation.precoUnitario,
          taxas: operation.taxas,
          moeda: operation.moeda,
          cambio: operation.cambio,
          dataOperacao: operation.dataOperacao,
        })),
      resumo: {
        valorAtualBRL,
        valorCotadoBRL,
        totalInvestidoBRL,
        lucroNaoRealizadoBRL:
          valorAtualBRL === null ? null : valorAtualBRL - totalInvestidoBRL,
        lucroRealizadoBRL,
        rentabilidadePercentual:
          valorAtualBRL !== null && totalInvestidoBRL > 0
            ? ((valorAtualBRL - totalInvestidoBRL) / totalInvestidoBRL) * 100
            : null,
        quantidadeAtivos: positions.length,
        valuationComplete,
        valuationPartial,
      },
      graficos: {
        porSetor: groupBy((position) => position.setor || "Não informado"),
        porClasse: groupBy((position) => position.tipoAtivo),
      },
      historicoPatrimonial: snapshots.map((snapshot) => ({
        dateKey: snapshot.dateKey,
        valuationComplete: snapshot.valuationComplete,
        porClasse: snapshot.porClasse.map((item) => ({
          tipoAtivo: item.tipoAtivo,
          investidoBRL: item.investidoBRL,
          valorAtualBRL: item.valorAtualBRL,
        })),
      })),
      avisoCotacoes:
        "Cotações públicas podem ter atraso, limites ou indisponibilidade. Yahoo Finance não oferece SLA; CoinGecko pode limitar chamadas. Não é um feed profissional em tempo real.",
    });
  } catch (error) {
    console.error("Erro ao carregar carteira de investimentos:", error);
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível carregar a carteira.",
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return jsonError("Não autorizado.", 401);

    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonError("Corpo da operação inválido.", 400);
    }
    const ticker = String(body.ticker ?? "").trim().toUpperCase();
    const nomeInformado = String(body.nome ?? "").trim();
    const setor = String(body.setor ?? "").trim().slice(0, 80) || "Não informado";
    const tipoAtivo = body.tipoAtivo;
    const lado = body.lado;
    const moeda = body.moeda;
    const quantidade = Number(body.quantidade);
    const precoUnitario = Number(body.precoUnitario);
    const taxas = Number(body.taxas ?? 0);
    let cambio = Number(body.cambio ?? 1);
    const dataOperacao = new Date(body.dataOperacao);

    if (!/^[A-Z0-9.^=+-]{1,20}$/.test(ticker)) return jsonError("Ticker inválido.", 400);
    if (!isOneOf(tipoAtivo, TIPOS_ATIVO)) return jsonError("Tipo de ativo inválido.", 400);
    const nome = nomeInformado || (tipoAtivo === "RENDA_FIXA" ? ticker : "");
    if (!nome || nome.length > 120) return jsonError("Informe o nome do ativo (máximo 120 caracteres).", 400);
    if (!isOneOf(lado, LADOS_OPERACAO)) return jsonError("Tipo de operação inválido.", 400);
    if (!isOneOf(moeda, MOEDAS_INVESTIMENTO)) return jsonError("Moeda não suportada.", 400);
    if (!Number.isFinite(quantidade) || quantidade <= 0) return jsonError("A quantidade deve ser maior que zero.", 400);
    if (!Number.isFinite(precoUnitario) || precoUnitario < 0) return jsonError("O preço deve ser um valor não negativo.", 400);
    if (!Number.isFinite(taxas) || taxas < 0) return jsonError("As taxas devem ser um valor não negativo.", 400);
    if (!Number.isFinite(cambio) || cambio <= 0) return jsonError("Informe um câmbio BRL positivo para a operação.", 400);
    if (moeda === "BRL") cambio = 1;
    if (Number.isNaN(dataOperacao.getTime())) return jsonError("Data da operação inválida.", 400);
    if (tipoAtivo === "CRIPTO" && moeda !== "USD") {
      return jsonError("As cotações de criptomoedas são consultadas em USD; informe a operação nessa moeda.", 400);
    }

    await connectDB();
    const existingDocs = await OperacaoInvestimento.find({ userId })
      .sort({ dataOperacao: 1, createdAt: 1 })
      .lean();
    const existing = existingDocs as unknown as Operacao[];
    const candidate = {
      ticker,
      nome,
      tipoAtivo,
      setor,
      lado,
      quantidade,
      precoUnitario,
      taxas,
      moeda,
      cambio,
      dataOperacao,
      _id: "nova-operacao",
    } as Operacao;

    try {
      calcularPosicoes([...existing, candidate].sort(
        (a, b) => new Date(a.dataOperacao).getTime() - new Date(b.dataOperacao).getTime()
      ));
    } catch (error) {
      return jsonError(error instanceof Error ? error.message : "Operação inválida.", 400);
    }

    const operation = await OperacaoInvestimento.create({
      userId,
      ticker,
      nome,
      tipoAtivo: tipoAtivo as TipoAtivo,
      setor,
      lado: lado as LadoOperacao,
      quantidade,
      precoUnitario,
      taxas,
      moeda: moeda as MoedaInvestimento,
      cambio,
      dataOperacao,
    });

    return NextResponse.json({ sucesso: true, id: operation._id.toString() }, { status: 201 });
  } catch (error) {
    console.error("Erro ao registrar operação de investimento:", error);
    return jsonError("Não foi possível registrar a operação.", 500);
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return jsonError("Não autorizado.", 401);

    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonError("Corpo da cotação inválido.", 400);
    }
    const ticker = String(body.ticker ?? "").trim().toUpperCase();
    const preco = Number(body.preco);
    if (!/^[A-Z0-9.^=+-]{1,20}$/.test(ticker)) return jsonError("Ticker inválido.", 400);
    if (!Number.isFinite(preco) || preco < 0) return jsonError("Informe um preço atual válido.", 400);

    await connectDB();
    const position = await OperacaoInvestimento.findOne({ userId, ticker, tipoAtivo: "RENDA_FIXA" }).lean();
    if (!position) return jsonError("Apenas ativos de renda fixa permitem preço manual.", 400);

    await PrecoManualInvestimento.findOneAndUpdate(
      { userId, ticker },
      { $set: { preco, moeda: position.moeda, atualizadoEm: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return NextResponse.json({ sucesso: true });
  } catch (error) {
    console.error("Erro ao atualizar preço manual do investimento:", error);
    return jsonError("Não foi possível atualizar o preço atual.", 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return jsonError("Não autorizado.", 401);

    const id = new URL(request.url).searchParams.get("id");
    if (!id || !Types.ObjectId.isValid(id)) return jsonError("Operação inválida.", 400);

    await connectDB();
    const existingDocs = await OperacaoInvestimento.find({ userId }).sort({ dataOperacao: 1, createdAt: 1 }).lean();
    const existing = existingDocs as unknown as Operacao[];
    const target = existing.find((operation) => operation._id.toString() === id);
    if (!target) return jsonError("Operação não encontrada.", 404);

    try {
      calcularPosicoes(existing.filter((operation) => operation._id.toString() !== id));
    } catch (error) {
      return jsonError(
        error instanceof Error ? `Não é possível excluir: ${error.message}` : "A exclusão invalida operações posteriores.",
        409
      );
    }

    await OperacaoInvestimento.deleteOne({ _id: id, userId });
    return NextResponse.json({ sucesso: true });
  } catch (error) {
    console.error("Erro ao excluir operação de investimento:", error);
    return jsonError("Não foi possível excluir a operação.", 500);
  }
}
