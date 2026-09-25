// app/api/auth/esqueci-senha/route.ts
export const runtime = "nodejs";

import { sendResetPasswordEmail } from "@/lib/email";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

function getApplicationUrl(request: Request) {
  const configuredUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
  return (configuredUrl || new URL(request.url).origin).replace(/\/$/, "");
}

export async function POST(req: Request) {
  try {
    const { email: rawEmail } = await req.json();
    const email = String(rawEmail ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { message: "Informe um e-mail válido." },
        { status: 400 }
      );
    }

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

    try {
      await sendResetPasswordEmail(user.email, resetToken, getApplicationUrl(req));
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      const message = emailError instanceof Error ? emailError.message : "";
      const isResendTestRestriction = message.includes("only send testing emails");
      const isUnverifiedDomain = message.includes("domain is not verified");

      console.error("Erro ao enviar recuperação de senha:", emailError);

      return NextResponse.json(
        {
          message: isResendTestRestriction
            ? "O serviço de e-mail está em modo de teste. Verifique um domínio no Resend e configure o remetente da aplicação."
            : isUnverifiedDomain
              ? "O domínio configurado como remetente ainda não foi verificado no Resend."
            : "Não foi possível enviar o e-mail de recuperação. Verifique a configuração do serviço de e-mail.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      message: "Se o e-mail existir, enviaremos instruções.",
    });
  } catch (error) {
    console.error("Erro ao enviar recuperação de senha:", error);

    return NextResponse.json(
      { message: "Erro interno" },
      { status: 500 }
    );
  }
}