import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        try {
          await connectDB();

          const user = await User.findOne({
            email: credentials?.email,
          });

          console.log("EMAIL:", credentials?.email);
          console.log("SENHA DIGITADA:", credentials?.password);
          console.log("USER:", user);

          if (!user) {
            console.log("USUÁRIO NÃO ENCONTRADO");
            return null;
          }

          const senhaCorreta = await bcrypt.compare(
            credentials!.password,
            user.password
          );

          console.log("SENHA CORRETA?", senhaCorreta);

          if (!senhaCorreta) {
            console.log("SENHA INVÁLIDA");
            return null;
          }

          return {
            id: user._id.toString(),
            name: user.nome,
            email: user.email,
          };

        } catch (error) {
          console.error(error);

          return null;
        }
      }
    }),
  ],

  pages: {
    signIn: "/",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };