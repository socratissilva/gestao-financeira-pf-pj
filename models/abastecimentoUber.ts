//models/abastecimentoUber.ts
import mongoose, { Schema, models, model } from "mongoose";

const AbastecimentoUberSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    data: {
      type: Date,
      required: true,
    },

    tipoCombustivel: {
      type: String,
      enum: ["Gasolina", "Etanol"],
      required: true,
    },

    tipoVeiculo: {
      type: String,
      enum: ["Carro", "Moto"],
      required: true,
    },

    litros: {
      type: Number,
      required: true,
    },

    valor: {
      type: Number,
      required: true,
    },

    km: {
      type: Number,
      required: true,
    },

    preco: {
      type: String,
      required: true,
    },

    consumo: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const AbastecimentoUber =
  models.AbastecimentoUber ||
  model("AbastecimentoUber", AbastecimentoUberSchema);

export default AbastecimentoUber as mongoose.Model<any>;