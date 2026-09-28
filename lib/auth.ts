// lib/auth.ts
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { MODULOS_LEGADOS } from "@/constants/modulos";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {},
      async authorize(credentials: any) {
        await connectDB();
        const { email, password } = credentials;

        const user = await User.findOne({ email });
        
        if (!user) return null;

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) return null;

        // Retorna os dados para compor a sessão do NextAuth
        return {
          id: user._id.toString(),
          name: user.nome,
          email: user.email,
          role: user.role, // Passando o papel para a sessão
          modulos: user.modulos,
        };
      },
    }),
  ],
  session: { strategy: "jwt" as const },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    // Injeta a 'role' e o 'id' no token JWT e na Sessão
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.name = user.name;
        token.modulos = user.modulos;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.id;
        await connectDB();
        const user = await User.findById(token.id)
          .select("nome role modulos")
          .lean();

        if (user && !Array.isArray(user)) {
          session.user.role = user.role;
          session.user.name = user.nome;
          session.user.modulos = user.modulos ?? MODULOS_LEGADOS;
        } else {
          session.user.modulos = [];
        }
      }
      return session;
    },
  },
};
