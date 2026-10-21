import type {
  LadoOperacao,
  MoedaInvestimento,
  TipoAtivo,
} from "@/models/OperacaoInvestimento";

export interface OperacaoCarteira {
  ticker: string;
  nome: string;
  tipoAtivo: TipoAtivo;
  setor: string;
  lado: LadoOperacao;
  quantidade: number;
  precoUnitario: number;
  taxas: number;
  moeda: MoedaInvestimento;
  cambio: number;
  dataOperacao: Date | string;
}

export interface PosicaoCalculada {
  ticker: string;
  nome: string;
  tipoAtivo: TipoAtivo;
  setor: string;
  moeda: MoedaInvestimento;
  quantidade: number;
  custoNativo: number;
  custoBRL: number;
  lucroRealizadoBRL: number;
}

export function calcularPosicoes(operacoes: OperacaoCarteira[]) {
  const positions = new Map<string, PosicaoCalculada>();
  let lucroRealizadoBRL = 0;

  for (const operation of operacoes) {
    const current = positions.get(operation.ticker) ?? {
      ticker: operation.ticker,
      nome: operation.nome,
      tipoAtivo: operation.tipoAtivo,
      setor: operation.setor || "Não informado",
      moeda: operation.moeda,
      quantidade: 0,
      custoNativo: 0,
      custoBRL: 0,
      lucroRealizadoBRL: 0,
    };

    if (current.tipoAtivo !== operation.tipoAtivo || current.moeda !== operation.moeda) {
      throw new Error(`As operações de ${operation.ticker} precisam manter o mesmo tipo e moeda.`);
    }

    if (operation.lado === "COMPRA") {
      current.quantidade += operation.quantidade;
      current.custoNativo += operation.quantidade * operation.precoUnitario + operation.taxas;
      current.custoBRL += (operation.quantidade * operation.precoUnitario + operation.taxas) * operation.cambio;
      current.nome = operation.nome;
      current.setor = operation.setor || current.setor;
    } else {
      if (operation.quantidade > current.quantidade + 1e-8) {
        throw new Error(`Venda de ${operation.ticker} excede a quantidade disponível.`);
      }

      const custoMedioNativo = current.quantidade > 0 ? current.custoNativo / current.quantidade : 0;
      const custoMedioBRL = current.quantidade > 0 ? current.custoBRL / current.quantidade : 0;
      const custoBaixadoBRL = custoMedioBRL * operation.quantidade;
      const resultadoVendaBRL =
        (operation.quantidade * operation.precoUnitario - operation.taxas) * operation.cambio -
        custoBaixadoBRL;

      current.quantidade -= operation.quantidade;
      current.custoNativo = Math.max(0, current.custoNativo - custoMedioNativo * operation.quantidade);
      current.custoBRL = Math.max(0, current.custoBRL - custoBaixadoBRL);
      current.lucroRealizadoBRL += resultadoVendaBRL;
      lucroRealizadoBRL += resultadoVendaBRL;
    }

    positions.set(operation.ticker, current);
  }

  return {
    positions: [...positions.values()].filter((position) => position.quantidade > 1e-8),
    lucroRealizadoBRL,
  };
}
