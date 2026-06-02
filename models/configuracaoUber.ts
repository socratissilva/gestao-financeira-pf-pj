//models/configuracaoUber.ts
import mongoose, { Schema } from "mongoose";

const configuracaoUberSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

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