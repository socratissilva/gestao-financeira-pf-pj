// app/api/auth/esqueci-senha/route.ts
export const runtime = "nodejs";

import { sendResetPasswordEmail } from "@/lib/email";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    await connectDB();

    const user = await User.findOne({
      email: email,
    });

    // 🔒 segurança: não revelar se existe ou não
    if (!user) {
      return NextResponse.json({
        message: "Se o e-mail existir, enviaremos instruções.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + 3600000);

    await user.save();

    // const userCheck = await User.findById(user._id);

    await sendResetPasswordEmail(user.email, resetToken);


    const resetUrl = `${process.env.NEXTAUTH_URL}/recuperar-senha?token=${resetToken}`;

    return NextResponse.json({
      message: "Se o e-mail existir, enviaremos instruções.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Erro interno" },
      { status: 500 }
    );
  }
}