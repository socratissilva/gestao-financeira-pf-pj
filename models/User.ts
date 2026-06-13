// models/User.ts
import mongoose, { Schema, models } from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      default: "PADRAO",
    },

    isAtivo: {
      type: Boolean,
      default: true,
    },

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpire: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User =
  models.User ||
  mongoose.model("User", UserSchema);

export default models.User || mongoose.model("User", UserSchema);




