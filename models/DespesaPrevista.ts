import {
  Schema,
  model,
  models,
  Model,
  Document,
} from "mongoose";

export interface IDespesaPrevista
  extends Document {
  userId: string;

  mesAno: Date;

  categoria: string;

  valor: number;

  dataVencimento?: Date;

  formaPagamento:
    | "PIX"
    | "DINHEIRO"
    | "DEBITO"
    | "CREDITO"
    | "TICKET";

  cartaoId?: string;

  observacao?: string;

  recorrente: boolean;

  mesAnoFim?: Date | null;

  ativa: boolean;
}

const DespesaPrevistaSchema =
  new Schema<IDespesaPrevista>(
    {
      userId: {
        type: String,
        required: true,
        index: true,
      },

      mesAno: {
        type: Date,
        required: true,
      },

      categoria: {
        type: String,
        required: true,
      },

      valor: {
        type: Number,
        required: true,
        min: 0,
      },

      dataVencimento: {
        type: Date,
        default: null,
      },

      formaPagamento: {
        type: String,
        enum: [
          "PIX",
          "DINHEIRO",
          "DEBITO",
          "CREDITO",
          "TICKET",
        ],
        required: true,
      },

      cartaoId: {
        type: String,
        default: null,
      },

      observacao: {
        type: String,
        default: "",
      },

      recorrente: {
        type: Boolean,
        default: false,
      },

      mesAnoFim: {
        type: Date,
        default: null,
      },

      ativa: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

const DespesaPrevista =
  (models.DespesaPrevista as Model<IDespesaPrevista>) ||
  model<IDespesaPrevista>(
    "DespesaPrevista",
    DespesaPrevistaSchema,
    "despesas_previstas"
  );

export default DespesaPrevista;