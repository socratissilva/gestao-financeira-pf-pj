//models/manutencaoUber.ts
import mongoose, { Schema } from "mongoose";

const manutencaoSchema = new Schema(
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

    tipo: {
      type: String,
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

    // ✅ PREVISÃO POR DATA (REGRA DE NEGÓCIO)
    proximaData: {
      type: Date,
      default: null,
    },

    // ✅ PREVISÃO POR KM (REGRA DE NEGÓCIO)
    proximaKm: {
      type: Number,
      default: 0,
    },

    observacoes: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      default: "Pendente",
    },
  },
  {
    timestamps: true,
  }
);

const ManutencaoUber =
  mongoose.models.ManutencaoUber ||
  mongoose.model("ManutencaoUber", manutencaoSchema);

export default ManutencaoUber as mongoose.Model<any>;