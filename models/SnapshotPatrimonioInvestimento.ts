import { Model, Schema, model, models } from "mongoose";
import type { TipoAtivo } from "@/models/OperacaoInvestimento";

export interface ISnapshotPatrimonioInvestimento {
  userId: string;
  dateKey: string;
  valuationComplete: boolean;
  porClasse: Array<{
    tipoAtivo: TipoAtivo;
    investidoBRL: number;
    valorAtualBRL: number | null;
  }>;
}

const SnapshotPatrimonioInvestimentoSchema =
  new Schema<ISnapshotPatrimonioInvestimento>(
    {
      userId: { type: String, required: true, index: true },
      dateKey: { type: String, required: true },
      valuationComplete: { type: Boolean, required: true },
      porClasse: [
        {
          _id: false,
          tipoAtivo: { type: String, required: true },
          investidoBRL: { type: Number, required: true },
          valorAtualBRL: { type: Number, default: null },
        },
      ],
    },
    { timestamps: true }
  );

SnapshotPatrimonioInvestimentoSchema.index(
  { userId: 1, dateKey: 1 },
  { unique: true }
);

const SnapshotPatrimonioInvestimento =
  (models.SnapshotPatrimonioInvestimento as Model<ISnapshotPatrimonioInvestimento>) ||
  model<ISnapshotPatrimonioInvestimento>(
    "SnapshotPatrimonioInvestimento",
    SnapshotPatrimonioInvestimentoSchema,
    "snapshots_patrimonio_investimento"
  );

export default SnapshotPatrimonioInvestimento;
