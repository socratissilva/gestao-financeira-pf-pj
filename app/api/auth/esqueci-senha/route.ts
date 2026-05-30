// import { NextResponse } from "next/server";
// import crypto from "crypto";
// import nodemailer from "nodemailer";

// import User from "@/models/User"; 
// import mongoose from "mongoose";

// // Função auxiliar para conectar ao banco (caso não tenha um arquivo separado)
// const connectMongoDB = async () => {
//   if (mongoose.connection.readyState === 1) return mongoose.connection.asPromise();
//   return await mongoose.connect(process.env.MONGODB_URI as string);
// };

// export async function POST(req: Request) {
//   try {
//     const { email } = await req.json();
//     await connectMongoDB();

//     const user = await User.findOne({ email });

//     if (!user) {
//       // Retornamos 404 para avisar o frontend que o e-mail não existe
//       return NextResponse.json({ message: "E-mail não encontrado em nossa base." }, { status: 404 });
//     }

//     // 1. Gera um token aleatório e seguro
//     const resetToken = crypto.randomBytes(32).toString("hex");

//     // 2. Salva o token no banco com validade de 1 hora (3600000 ms)
//     user.resetPasswordToken = resetToken;
//     user.resetPasswordExpire = new Date(Date.now() + 3600000);
//     await user.save();

//     // 3. Configura o "carteiro" (Nodemailer) para enviar o e-mail
//     const transporter = nodemailer.createTransport({
//       service: "gmail", // Vamos usar o Gmail para os testes
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     // 4. Monta a URL de recuperação que o usuário vai clicar
//     // Ex: http://localhost:3000/recuperar-senha?token=a1b2c3d4...
//     const resetUrl = `${process.env.NEXTAUTH_URL}/recuperar-senha?token=${resetToken}`;

//     // 5. Monta o corpo do e-mail
//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: user.email,
//       subject: "Recuperação de Senha - Regulariza PBH",
//       html: `
//         <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
//           <div style="text-align: center; marginBottom: 20px;">
//             <img 
//               src="https://static.vecteezy.com/ti/vetor-gratis/p1/49753728-teste-folha-projeto-isolado-em-branco-fundo-vetor.jpg" 
//               alt="Logo Regulariza PBH" 
//               style="width: 200px; height: auto; border-radius: 8px;"
//             />
//           </div>
          
//           <h2 style="color: #0070f3; text-align: center;">Recuperação de Senha</h2>
          
//           <p>Olá, <strong>${user.nome}</strong>!</p>
          
//           <p>Recebemos uma solicitação para redefinir a senha da sua conta no sistema <strong>Regulariza PBH</strong>.</p>
          
//           <div style="text-align: center; margin: 30px 0;">
//             <a href="${resetUrl}" style="display: inline-block; padding: 14px 25px; background-color: #0070f3; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">
//               Redefinir minha senha
//             </a>
//           </div>
          
//           <p style="font-size: 14px; color: #666;">
//             <strong>Atenção:</strong> Este link é válido por apenas 1 hora. Se você não solicitou esta alteração, ignore este e-mail por segurança.
//           </p>
          
//           <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          
//           <p style="font-size: 12px; color: #999; text-align: center;">
//             Este é um e-mail automático, por favor não responda.
//           </p>
//         </div>
//       `,
//     };

//     // 6. Dispara o e-mail
//     await transporter.sendMail(mailOptions);

//     return NextResponse.json({ message: "E-mail enviado com sucesso." }, { status: 200 });

//   } catch (error) {
//     console.error("Erro na recuperação de senha:", error);
//     return NextResponse.json({ message: "Erro interno ao tentar enviar o e-mail." }, { status: 500 });
//   }
// }

// app/api/auth/esqueci-senha/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";

import User from "@/models/User"; 
import mongoose from "mongoose";

// Função auxiliar para conectar ao banco (caso não tenha um arquivo separado)
const connectMongoDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection.asPromise();
  return await mongoose.connect(process.env.MONGODB_URI as string);
};

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    await connectMongoDB();

    const user = await User.findOne({ email });

    if (!user) {
      // Retornamos 404 para avisar o frontend que o e-mail não existe
      return NextResponse.json({ message: "E-mail não encontrado em nossa base." }, { status: 404 });
    }

    // 1. Gera um token aleatório e seguro
    const resetToken = crypto.randomBytes(32).toString("hex");

    // 2. Salva o token no banco com validade de 1 hora (3600000 ms)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = new Date(Date.now() + 3600000);
    await user.save();

    // 3. Configura o "carteiro" (Nodemailer) para enviar o e-mail
    const transporter = nodemailer.createTransport({
      service: "gmail", // Vamos usar o Gmail para os testes
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 4. Monta a URL de recuperação que o usuário vai clicar
    // Ex: http://localhost:3000/recuperar-senha?token=a1b2c3d4...
    const resetUrl = `${process.env.NEXTAUTH_URL}/recuperar-senha?token=${resetToken}`;

    // 5. Monta o corpo do e-mail
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Recuperação de Senha - Regulariza PBH",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
          <div style="text-align: center; marginBottom: 20px;">
            <img 
              src="https://static.vecteezy.com/ti/vetor-gratis/p1/49753728-teste-folha-projeto-isolado-em-branco-fundo-vetor.jpg" 
              alt="Logo Regulariza PBH" 
              style="width: 200px; height: auto; border-radius: 8px;"
            />
          </div>
          
          <h2 style="color: #0070f3; text-align: center;">Recuperação de Senha</h2>
          
          <p>Olá, <strong>${user.nome}</strong>!</p>
          
          <p>Recebemos uma solicitação para redefinir a senha da sua conta no sistema <strong>Regulariza PBH</strong>.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 14px 25px; background-color: #0070f3; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Redefinir minha senha
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            <strong>Atenção:</strong> Este link é válido por apenas 1 hora. Se você não solicitou esta alteração, ignore este e-mail por segurança.
          </p>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            Este é um e-mail automático, por favor não responda.
          </p>
        </div>
      `,
    };

    // 6. Dispara o e-mail
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: "E-mail enviado com sucesso." }, { status: 200 });

  } catch (error) {
    console.error("Erro na recuperação de senha:", error);
    return NextResponse.json({ message: "Erro interno ao tentar enviar o e-mail." }, { status: 500 });
  }
}