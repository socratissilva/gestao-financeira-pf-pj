import { Schema, model, models, Model, Document } from "mongoose";

/* =========================
   TIPAGEM
========================= */
export interface IReceitaRealizada extends Document {
  userId: string;
  mesAno: Date;
  categoria: string;
  valor: number;
  observacao: string;
}

/* =========================
   SCHEMA
========================= */
const ReceitaRealizadaSchema = new Schema<IReceitaRealizada>(
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

    observacao: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

/* =========================
   MODEL
========================= */
const ReceitaRealizada =
  (models.ReceitaRealizada as Model<IReceitaRealizada>) ||
  model<IReceitaRealizada>(
    "ReceitaRealizada",
    ReceitaRealizadaSchema,
    "receitas_realizadas"
  );

export default ReceitaRealizada;