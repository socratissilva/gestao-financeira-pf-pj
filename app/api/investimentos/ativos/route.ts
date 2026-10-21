import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { MoedaInvestimento, TipoAtivo } from "@/models/OperacaoInvestimento";

export const runtime = "nodejs";

interface YahooQuote {
  symbol?: string;
  shortname?: string;
  longname?: string;
  quoteType?: string;
  sector?: string;
  industry?: string;
  exchange?: string;
}

interface YahooSearchResponse {
  quotes?: YahooQuote[];
}

interface CoinSearchResponse {
  coins?: Array<{
    id: string;
    symbol: string;
    name: string;
    market_cap_rank?: number | null;
  }>;
}

interface CoinDetailsResponse {
  name?: string;
  categories?: string[];
}

const CRIPTO_IDS: Record<string, string> = {
  ADA: "cardano",
  AVAX: "avalanche-2",
  BNB: "binancecoin",
  BTC: "bitcoin",
  DOGE: "dogecoin",
  DOT: "polkadot",
  ETH: "ethereum",
  LINK: "chainlink",
  LTC: "litecoin",
  SOL: "solana",
  TRX: "tron",
  USDC: "usd-coin",
  USDT: "tether",
  XRP: "ripple",
};

function isTipoAtivo(value: string): value is TipoAtivo {
  return ["ACAO", "FII", "ETF", "BDR", "CRIPTO", "RENDA_FIXA"].includes(value);
}

function isMoeda(value: string): value is MoedaInvestimento {
  return ["BRL", "USD", "EUR", "GBP"].includes(value);
}

async function buscarYahoo(ticker: string) {
  const url = new URL("https://query1.finance.yahoo.com/v1/finance/search");
  url.searchParams.set("q", ticker);
  url.searchParams.set("quotesCount", "10");
  url.searchParams.set("newsCount", "0");

  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!response.ok) throw new Error(`Yahoo Finance respondeu com status ${response.status}.`);

  const data = (await response.json()) as YahooSearchResponse;
  const quotes = data.quotes ?? [];
  const quote =
    quotes.find((item) => item.symbol?.toUpperCase() === ticker) ??
    quotes.find((item) => item.symbol?.toUpperCase() === `${ticker}.SA`);
  if (!quote) return null;

  const exchangeCurrencies: Record<string, MoedaInvestimento> = {
    AMS: "EUR",
    ASE: "USD",
    BRU: "EUR",
    FRA: "EUR",
    GER: "EUR",
    LSE: "GBP",
    MCE: "EUR",
    MIL: "EUR",
    NAS: "USD",
    NGM: "USD",
    NMS: "USD",
    NYQ: "USD",
    PAR: "EUR",
    PCX: "USD",
    SAO: "BRL",
    SWX: "EUR",
    VIE: "EUR",
  };

  return {
    nome: quote.longname?.trim() || quote.shortname?.trim() || quote.symbol || ticker,
    setor: quote.sector?.trim() || quote.industry?.trim() || "Setor não informado pela fonte",
    ticker: quote.symbol ?? ticker,
    moeda: quote.exchange ? exchangeCurrencies[quote.exchange] : undefined,
    fonte: "Yahoo Finance",
  };
}

async function buscarCripto(ticker: string) {
  let coinId = CRIPTO_IDS[ticker];
  let coinName = "";

  if (!coinId) {
    const searchUrl = new URL("https://api.coingecko.com/api/v3/search");
    searchUrl.searchParams.set("query", ticker);
    const searchResponse = await fetch(searchUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!searchResponse.ok) throw new Error(`CoinGecko respondeu com status ${searchResponse.status}.`);

    const search = (await searchResponse.json()) as CoinSearchResponse;
    const match = search.coins
      ?.filter((coin) => coin.symbol.toUpperCase() === ticker)
      .sort((a, b) => (a.market_cap_rank ?? Number.MAX_SAFE_INTEGER) - (b.market_cap_rank ?? Number.MAX_SAFE_INTEGER))[0];
    if (!match) return null;
    coinId = match.id;
    coinName = match.name;
  }

  const detailsUrl = new URL(`https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}`);
  detailsUrl.searchParams.set("localization", "false");
  detailsUrl.searchParams.set("tickers", "false");
  detailsUrl.searchParams.set("market_data", "false");
  detailsUrl.searchParams.set("community_data", "false");
  detailsUrl.searchParams.set("developer_data", "false");
  detailsUrl.searchParams.set("sparkline", "false");

  const detailsResponse = await fetch(detailsUrl, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!detailsResponse.ok) throw new Error(`CoinGecko respondeu com status ${detailsResponse.status}.`);
  const details = (await detailsResponse.json()) as CoinDetailsResponse;

  return {
    nome: details.name?.trim() || coinName || ticker,
    setor: details.categories?.find(Boolean) || "Criptomoedas",
    ticker,
    moeda: "USD",
    fonte: "CoinGecko",
  };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const params = new URL(request.url).searchParams;
    const ticker = (params.get("ticker") ?? "").trim().toUpperCase();
    const tipoAtivo = (params.get("tipoAtivo") ?? "").trim().toUpperCase();
    const moeda = (params.get("moeda") ?? "BRL").trim().toUpperCase();

    if (!/^[A-Z0-9.^=+-]{1,20}$/.test(ticker)) {
      return NextResponse.json({ error: "Ticker inválido." }, { status: 400 });
    }
    if (!isTipoAtivo(tipoAtivo)) {
      return NextResponse.json({ error: "Tipo de ativo inválido." }, { status: 400 });
    }
    if (!isMoeda(moeda)) {
      return NextResponse.json({ error: "Moeda não suportada." }, { status: 400 });
    }

    if (tipoAtivo === "RENDA_FIXA") {
      return NextResponse.json({
        ativo: {
          ticker,
          nome: ticker,
          setor: "Renda fixa",
          fonte: "Classificação do módulo",
        },
      });
    }

    if (tipoAtivo === "CRIPTO") {
      const ativo = await buscarCripto(ticker);
      if (!ativo) return NextResponse.json({ ativo: null, error: "Criptoativo não encontrado." });
      return NextResponse.json({ ativo });
    }

    const ativo = await buscarYahoo(ticker);
    if (!ativo) return NextResponse.json({ ativo: null, error: "Ticker não encontrado no Yahoo Finance." });
    return NextResponse.json({ ativo: { ...ativo, moeda: ativo.moeda ?? moeda } });
  } catch (error) {
    console.error("Erro ao buscar metadados do ativo:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível buscar o ativo." },
      { status: 502 }
    );
  }
}
