import mongoose from "mongoose";

const ReceitaSchema = new mongoose.Schema(
    {
        data: {
            type: Date,
            required: true,
        },

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

        dataFim: {
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

// 🔥 FIX PRINCIPAL (evita crash no Next + Turbopack)
const Receita =
    mongoose.models.Receita ||
    mongoose.model("Receita", ReceitaSchema);

export default Receita;