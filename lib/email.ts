import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendResetPasswordEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/recuperar-senha?token=${token}`;

  return await resend.emails.send({
    from: "Sistema <onboarding@resend.dev>",
    to: email,
    subject: "Recuperação de Senha",
    html: `
      <div style="font-family: Arial">
        <h2>Recuperação de Senha</h2>
        <p>Você solicitou redefinição de senha.</p>
        <a href="${resetUrl}">
          Clique aqui para redefinir sua senha
        </a>
      </div>
    `,
  });
}