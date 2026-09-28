// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { MODULOS_LEGADOS } from "@/constants/modulos";
export const runtime = "nodejs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {},
      // app/api/auth/[...nextauth]/route.ts

      async authorize(credentials: any) {
        try {
          await connectDB();

          const email = String(credentials?.email ?? "").trim().toLowerCase();
          const password = String(credentials?.password ?? "");
          const rememberMe = credentials?.rememberMe;
          const user = await User.findOne({ email });

          if (!user) return null;

          if (user.isAtivo === false) {
            throw new Error("Usuário inativo. Acesso negado.");
          }

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (!passwordsMatch) return null;

          return {
            id: user._id.toString(),
            name: user.nome,
            email: user.email,
            role: user.role,
            modulos: user.modulos,
            rememberMe: rememberMe === "true",
          };
        } catch (error) {
          console.error("Erro na autenticação:", error);
          throw error;
        }
      }
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.name = user.name;
        token.role = user.role;
        token.id = user.id;
        token.modulos = user.modulos;
      }

      return token;
    },

    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        await connectDB();
        const user = await User.findById(token.id)
          .select("nome role modulos")
          .lean();

        if (user && !Array.isArray(user)) {
          session.user.name = user.nome;
          session.user.role = user.role;
          session.user.modulos = user.modulos ?? MODULOS_LEGADOS;
        } else {
          session.user.modulos = [];
        }
      }

      return session;
    },
  },
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };