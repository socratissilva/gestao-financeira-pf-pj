// app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import mongoose from "mongoose";
import crypto from "crypto";

const connectMongoDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection.asPromise();
  return await mongoose.connect(process.env.MONGODB_URI as string);
};

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: {
        $gt: new Date(),
      },
    }).lean();


    if (!user) {
      return NextResponse.json(
        { message: "Token inválido ou expirado. Tente recuperar a senha novamente." },
        { status: 400 }
      );
    }

    // 2. Criptografa a nova senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Atualiza o usuário e LIMPA os campos de token para que não possam ser usados de novo
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return NextResponse.json(
      { message: "Senha alterada com sucesso!" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json(
      { message: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}