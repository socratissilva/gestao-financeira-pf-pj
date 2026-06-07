// models/ReceitaPrevista.ts

import { Schema, model, models } from "mongoose";

const ReceitaPrevistaSchema = new Schema(
  {
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

const ReceitaPrevista =
  models.ReceitaPrevista ||
  model(
    "ReceitaPrevista",
    ReceitaPrevistaSchema,
    "receitas_previstas"
  );

export default ReceitaPrevista;