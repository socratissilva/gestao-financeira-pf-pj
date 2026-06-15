import { Schema, model, models, Model, Document } from "mongoose";

/* =========================
   TIPAGEM
========================= */
export interface IReceitaPrevista extends Document {
  userId: string;
  mesAno: Date;
  categoria: string;
  valor: number;

  valorRecebido: number | null;

  observacao: string;
  recorrente: boolean;
  mesAnoFim: Date | null;
}

/* =========================
   SCHEMA
========================= */
const ReceitaPrevistaSchema = new Schema<IReceitaPrevista>(
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
      enum: [
        "RENDA_1",
        "TICKET",
        "RENDA_2",
        "DECIMO",
        "FERIAS",
        "RESGATE",
        "OUTROS",
      ],
    },
    valor: {
      type: Number,
      required: true,
      min: 0,
    },

    valorRecebido: {
      type: Number,
      default: null,
      min: 0,
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
  },
  {
    timestamps: true,
  }
);

/* =========================
   MODEL
========================= */
const ReceitaPrevista =
  (models.ReceitaPrevista as Model<IReceitaPrevista>) ||
  model<IReceitaPrevista>(
    "ReceitaPrevista",
    ReceitaPrevistaSchema,
    "receitas_previstas"
  );

export default ReceitaPrevista;