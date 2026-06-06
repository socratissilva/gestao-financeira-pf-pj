// models/receita.ts
import mongoose from "mongoose";

const receitaSchema = new mongoose.Schema(
  {
    data: { type: Date, required: true },

    categoria: {
      type: String,
      enum: [
        "RENDA_1",
        "TICKET",
        "RENDA_2",
        "DECIMO",
        "FERIAS",
        "RESGATE",
        "OUTROS",
      ],
      required: true,
    },

    valor: { type: Number, required: true, min: 0 },

    observacao: { type: String, default: "" },

    recorrente: { type: Boolean, default: false },

    dataFim: { type: Date, default: null },

    ativa: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ✔ modelo correto (cache seguro no Next.js)
const Receita =
  mongoose.models.Receita || mongoose.model("Receita", receitaSchema);

export default Receita;