import { Resend } from "resend";
import nodemailer from "nodemailer";

export async function sendResetPasswordEmail(email: string, token: string, baseUrl: string) {
  const resetUrl = `${baseUrl}/recuperar-senha?token=${encodeURIComponent(token)}`;

  const html = `
      <div style="font-family: Arial">
        <h2>Recuperação de Senha</h2>
        <p>Você solicitou redefinição de senha.</p>
        <a href="${resetUrl}">
          Clique aqui para redefinir sua senha
        </a>
      </div>
    `;

  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (smtpUser && smtpPassword) {
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: smtpPort,
      secure: smtpPort === 465,
      requireTLS: smtpPort === 587,
      tls: {
        rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
      },
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    await transporter.sendMail({
      from: `Sistema Financeiro <${smtpUser}>`,
      to: email,
      subject: "Recuperação de Senha",
      html,
    });

    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "Sistema <onboarding@resend.dev>";

  if (!apiKey) {
    throw new Error("Configure SMTP_USER e SMTP_PASSWORD ou RESEND_API_KEY");
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: email,
    subject: "Recuperação de Senha",
    html,
  });

  if (error) {
    throw new Error(`Resend: ${error.message}`);
  }

  return data;
}