import type { MoedaInvestimento, TipoAtivo } from "@/models/OperacaoInvestimento";

export interface AtivoParaCotacao {
  ticker: string;
  tipoAtivo: TipoAtivo;
  moeda: MoedaInvestimento;
}

export interface Cotacao {
  preco: number | null;
  variacaoPercentual: number | null;
  moeda: string;
  fonte: string;
  atualizadoEm: string | null;
  erro: string | null;
}

interface YahooChartResponse {
  chart?: {
    error?: { description?: string } | null;
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
        regularMarketTime?: number;
        currency?: string;
      };
    }> | null;
  };
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

async function buscarYahoo(ticker: string): Promise<Cotacao> {
  try {
    const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`);
    url.searchParams.set("interval", "1d");
    url.searchParams.set("range", "5d");

    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!response.ok) {
      return {
        preco: null,
        variacaoPercentual: null,
        moeda: "",
        fonte: "Yahoo Finance",
        atualizadoEm: null,
        erro: `Yahoo Finance respondeu com status ${response.status}.`,
      };
    }

    const data = (await response.json()) as YahooChartResponse;
    const result = data.chart?.result?.[0];
    const meta = result?.meta;
    const isPenceQuote = meta?.currency === "GBp" || meta?.currency === "GBX";
    const quoteDivisor = isPenceQuote ? 100 : 1;
    const rawPrice = meta?.regularMarketPrice;
    const rawPreviousClose = meta?.chartPreviousClose ?? meta?.previousClose;
    const price = typeof rawPrice === "number" ? rawPrice / quoteDivisor : rawPrice;
    const previousClose =
      typeof rawPreviousClose === "number" ? rawPreviousClose / quoteDivisor : rawPreviousClose;

    if (!meta || typeof price !== "number" || !Number.isFinite(price)) {
      return {
        preco: null,
        variacaoPercentual: null,
        moeda: isPenceQuote ? "GBP" : meta?.currency ?? "",
        fonte: "Yahoo Finance",
        atualizadoEm: null,
        erro: data.chart?.error?.description ?? "Cotação não disponível para este ativo.",
      };
    }

    return {
      preco: price,
      variacaoPercentual:
        typeof previousClose === "number" && previousClose !== 0
          ? ((price - previousClose) / previousClose) * 100
          : null,
      moeda: isPenceQuote ? "GBP" : meta.currency ?? "",
      fonte: "Yahoo Finance",
      atualizadoEm: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : null,
      erro: null,
    };
  } catch (error) {
    return {
      preco: null,
      variacaoPercentual: null,
      moeda: "",
      fonte: "Yahoo Finance",
      atualizadoEm: null,
      erro: error instanceof Error ? error.message : "Não foi possível consultar o Yahoo Finance.",
    };
  }
}

async function buscarCriptos(tickers: string[]): Promise<Map<string, Cotacao>> {
  const result = new Map<string, Cotacao>();
  const unsupported = tickers.filter((ticker) => !CRIPTO_IDS[ticker]);

  for (const ticker of unsupported) {
    result.set(ticker, {
      preco: null,
      variacaoPercentual: null,
      moeda: "USD",
      fonte: "CoinGecko",
      atualizadoEm: null,
      erro: "Criptoativo sem mapeamento CoinGecko. Use BTC, ETH, SOL, XRP, BNB, ADA, DOGE, TRX, AVAX, DOT, LINK, LTC, USDT ou USDC.",
    });
  }

  const supported = tickers.filter((ticker) => CRIPTO_IDS[ticker]);
  if (!supported.length) return result;

  try {
    const url = new URL("https://api.coingecko.com/api/v3/simple/price");
    url.searchParams.set("ids", [...new Set(supported.map((ticker) => CRIPTO_IDS[ticker]))].join(","));
    url.searchParams.set("vs_currencies", "usd");
    url.searchParams.set("include_24hr_change", "true");

    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`CoinGecko respondeu com status ${response.status}.`);

    const data = (await response.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
    for (const ticker of supported) {
      const coin = data[CRIPTO_IDS[ticker]];
      result.set(ticker, {
        preco: typeof coin?.usd === "number" ? coin.usd : null,
        variacaoPercentual: typeof coin?.usd_24h_change === "number" ? coin.usd_24h_change : null,
        moeda: "USD",
        fonte: "CoinGecko",
        atualizadoEm: new Date().toISOString(),
        erro: typeof coin?.usd === "number" ? null : "Cotação não retornada pela CoinGecko.",
      });
    }
  } catch (error) {
    for (const ticker of supported) {
      result.set(ticker, {
        preco: null,
        variacaoPercentual: null,
        moeda: "USD",
        fonte: "CoinGecko",
        atualizadoEm: null,
        erro: error instanceof Error ? error.message : "Não foi possível consultar a CoinGecko.",
      });
    }
  }

  return result;
}

export async function buscarCotacoes(ativos: AtivoParaCotacao[]): Promise<Map<string, Cotacao>> {
  const result = new Map<string, Cotacao>();
  const cryptos = ativos.filter((ativo) => ativo.tipoAtivo === "CRIPTO");
  const acoes = ativos.filter((ativo) => ativo.tipoAtivo !== "CRIPTO" && ativo.tipoAtivo !== "RENDA_FIXA");

  const cryptoQuotes = await buscarCriptos(cryptos.map((ativo) => ativo.ticker));
  const equityQuotes: Array<readonly [string, Cotacao]> = [];
  for (let index = 0; index < acoes.length; index += 6) {
    const batch = await Promise.all(
      acoes.slice(index, index + 6).map(async (ativo) => {
        const ticker =
          ativo.moeda === "BRL" && !ativo.ticker.includes(".") ? `${ativo.ticker}.SA` : ativo.ticker;
        return [ativo.ticker, await buscarYahoo(ticker)] as const;
      })
    );
    equityQuotes.push(...batch);
  }

  for (const [ticker, quote] of cryptoQuotes) result.set(`CRIPTO:${ticker}`, quote);
  for (const [ticker, quote] of equityQuotes) result.set(ticker, quote);
  return result;
}

export async function buscarCambioParaBRL(moedas: MoedaInvestimento[]): Promise<Map<MoedaInvestimento, number>> {
  const rates = new Map<MoedaInvestimento, number>([["BRL", 1]]);
  const externas = [...new Set(moedas)].filter((moeda) => moeda !== "BRL");

  const quotes = await Promise.all(
    externas.map(async (moeda) => [moeda, await buscarYahoo(`${moeda}BRL=X`)] as const)
  );

  for (const [moeda, quote] of quotes) {
    if (quote.preco !== null) rates.set(moeda, quote.preco);
  }
  return rates;
}
