import { Model, Schema, model, models } from "mongoose";
import type { MoedaInvestimento } from "@/models/OperacaoInvestimento";

export interface IPrecoManualInvestimento {
  userId: string;
  ticker: string;
  preco: number;
  moeda: MoedaInvestimento;
  atualizadoEm: Date;
}

const PrecoManualInvestimentoSchema = new Schema<IPrecoManualInvestimento>(
  {
    userId: { type: String, required: true, index: true },
    ticker: { type: String, required: true, trim: true, uppercase: true },
    preco: { type: Number, required: true, min: 0 },
    moeda: { type: String, enum: ["BRL", "USD", "EUR", "GBP"], required: true },
    atualizadoEm: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

PrecoManualInvestimentoSchema.index({ userId: 1, ticker: 1 }, { unique: true });

const PrecoManualInvestimento =
  (models.PrecoManualInvestimento as Model<IPrecoManualInvestimento>) ||
  model<IPrecoManualInvestimento>("PrecoManualInvestimento", PrecoManualInvestimentoSchema, "precos_manuais_investimento");

export default PrecoManualInvestimento;
