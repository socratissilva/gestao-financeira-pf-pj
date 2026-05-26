import mongoose, { Schema, models, model } from "mongoose";

const GanhoUberSchema = new Schema(
  {
    data: {
      type: Date,
      required: true,
    },

    plataforma: {
      type: String,
      required: true,
      trim: true,
    },

    valorBruto: {
      type: Number,
      required: true,
    },

    horasTrabalhadas: {
      type: Number,
      default: 0,
    },

    kmRodados: {
      type: Number,
      default: 0,
    },

    observacao: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const GanhoUber =
  models.GanhoUber || model("GanhoUber", GanhoUberSchema);

export default GanhoUber;