import { Document, Model, Schema, model, models } from "mongoose";

export const APORTE_MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export type AporteMonth = (typeof APORTE_MONTHS)[number];

export interface IAporte extends Document {
  userId: string;
  ano: number;
  meses: Record<AporteMonth, number>;
}

const AporteSchema = new Schema<IAporte>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    ano: {
      type: Number,
      required: true,
      min: 1900,
      max: 2100,
    },
    meses: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

AporteSchema.index({ userId: 1, ano: 1 }, { unique: true });

const Aporte =
  (models.Aporte as Model<IAporte>) ||
  model<IAporte>("Aporte", AporteSchema, "aportes");

export default Aporte;