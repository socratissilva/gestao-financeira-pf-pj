import mongoose, { Schema } from "mongoose";

const configuracaoUberSchema = new Schema(
  {
    kmAtualVeiculo: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ConfiguracaoUber ||
  mongoose.model(
    "ConfiguracaoUber",
    configuracaoUberSchema
  );