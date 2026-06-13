import mongoose, { Schema, model, models } from "mongoose";

const CartaoSchema = new Schema(
    {
        usuarioId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        nome: {
            type: String,
            required: true,
            trim: true,
        },

        vencimentoDia: {
            type: Number,
            required: true,
            min: 1,
            max: 31,
        },

        limite: {
            type: Number,
            default: null,
        },

        ativo: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

export default models.Cartao || model("Cartao", CartaoSchema);