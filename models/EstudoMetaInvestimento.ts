import { Document, Model, Schema, model, models } from "mongoose";

export interface IAtivoMetaInvestimento {
  ticker: string;
  percentual: number;
}

export interface IGrupoMetaInvestimento {
  percentual: number;
  ativos: IAtivoMetaInvestimento[];
}

export interface IAtivoRendaFixaMetaInvestimento {
  nome: string;
  percentual: number;
}

export interface IEstudoMetaInvestimento extends Document {
  userId: string;
  nome: string;
  rendaVariavelPercentual: number;
  rendaFixaPercentual?: number;
  distribuicaoVariavel: {
    etfs: IGrupoMetaInvestimento;
    fiis: IGrupoMetaInvestimento;
    acoes: IGrupoMetaInvestimento;
  };
  distribuicaoRendaFixa?: {
    ativos: IAtivoRendaFixaMetaInvestimento[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const AtivoRendaFixaMetaSchema = new Schema<IAtivoRendaFixaMetaInvestimento>(
  {
    nome: { type: String, trim: true, maxlength: 80, default: "" },
    percentual: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const AtivoMetaSchema = new Schema<IAtivoMetaInvestimento>(
  {
    ticker: { type: String, trim: true, uppercase: true, maxlength: 20, default: "" },
    percentual: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const GrupoMetaSchema = new Schema<IGrupoMetaInvestimento>(
  {
    percentual: { type: Number, required: true, min: 0, max: 100 },
    ativos: { type: [AtivoMetaSchema], required: true },
  },
  { _id: false }
);

const EstudoMetaInvestimentoSchema = new Schema<IEstudoMetaInvestimento>(
  {
    userId: { type: String, required: true, index: true },
    nome: { type: String, required: true, trim: true, maxlength: 80 },
    rendaVariavelPercentual: { type: Number, required: true, min: 0, max: 100 },
    rendaFixaPercentual: { type: Number, min: 0, max: 100 },
    distribuicaoVariavel: {
      etfs: { type: GrupoMetaSchema, required: true },
      fiis: { type: GrupoMetaSchema, required: true },
      acoes: { type: GrupoMetaSchema, required: true },
    },
    distribuicaoRendaFixa: {
      ativos: { type: [AtivoRendaFixaMetaSchema], default: undefined },
    },
  },
  { timestamps: true }
);

EstudoMetaInvestimentoSchema.index({ userId: 1, createdAt: -1 });

const EstudoMetaInvestimento =
  (models.EstudoMetaInvestimento as Model<IEstudoMetaInvestimento>) ||
  model<IEstudoMetaInvestimento>(
    "EstudoMetaInvestimento",
    EstudoMetaInvestimentoSchema,
    "estudos_metas_investimento"
  );

export default EstudoMetaInvestimento;
