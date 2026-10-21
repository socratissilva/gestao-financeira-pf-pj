import { Document, Model, Schema, model, models } from "mongoose";

export const TIPOS_ATIVO = ["ACAO", "FII", "ETF", "BDR", "CRIPTO", "RENDA_FIXA"] as const;
export const LADOS_OPERACAO = ["COMPRA", "VENDA"] as const;
export const MOEDAS_INVESTIMENTO = ["BRL", "USD", "EUR", "GBP"] as const;

export type TipoAtivo = (typeof TIPOS_ATIVO)[number];
export type LadoOperacao = (typeof LADOS_OPERACAO)[number];
export type MoedaInvestimento = (typeof MOEDAS_INVESTIMENTO)[number];

export interface IOperacaoInvestimento extends Document {
  userId: string;
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
  dataOperacao: Date;
}

const OperacaoInvestimentoSchema = new Schema<IOperacaoInvestimento>(
  {
    userId: { type: String, required: true, index: true },
    ticker: { type: String, required: true, trim: true, uppercase: true },
    nome: { type: String, required: true, trim: true },
    tipoAtivo: { type: String, enum: TIPOS_ATIVO, required: true },
    setor: { type: String, trim: true, default: "Não informado" },
    lado: { type: String, enum: LADOS_OPERACAO, required: true },
    quantidade: { type: Number, required: true, min: 0.00000001 },
    precoUnitario: { type: Number, required: true, min: 0 },
    taxas: { type: Number, required: true, min: 0, default: 0 },
    moeda: { type: String, enum: MOEDAS_INVESTIMENTO, required: true },
    cambio: { type: Number, required: true, min: 0.00000001, default: 1 },
    dataOperacao: { type: Date, required: true },
  },
  { timestamps: true }
);

OperacaoInvestimentoSchema.index({ userId: 1, ticker: 1, dataOperacao: 1 });

const OperacaoInvestimento =
  (models.OperacaoInvestimento as Model<IOperacaoInvestimento>) ||
  model<IOperacaoInvestimento>("OperacaoInvestimento", OperacaoInvestimentoSchema, "operacoes_investimento");

export default OperacaoInvestimento;
