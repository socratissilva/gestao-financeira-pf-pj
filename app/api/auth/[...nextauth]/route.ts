// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {},
      // app/api/auth/[...nextauth]/route.ts

      async authorize(credentials: any) {
        await connectDB();

        const { email, password, rememberMe } = credentials;

        // const user = await User.findOne({ email });

        const user = await User.findOne({
          email: email,
        }).lean();

        if (!user) return null;

        if (user.isAtivo === false) {
          throw new Error("Usuário inativo. Acesso negado.");
        }

        const passwordsMatch = await bcrypt.compare(
          password,
          user.password
        );

        if (!passwordsMatch) return null;

        return {
          id: user._id.toString(),
          name: user.nome,
          email: user.email,
          role: user.role,
          rememberMe: rememberMe === "true",
        };
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

      console.log("JWT USER:", user);

      if (user) {
        token.name = user.name;
        token.role = user.role;
        token.id = user.id;
      }

      console.log("JWT TOKEN:", token);

      return token;
    },

    async session({ session, token }: any) {

      console.log("SESSION TOKEN:", token);

      if (session.user) {
        session.user.name = token.name;
        session.user.role = token.role;
        session.user.id = token.id;
      }

      console.log("SESSION FINAL:", session);

      return session;
    },
  },
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };