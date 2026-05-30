// import NextAuth from "next-auth";
// import CredentialsProvider from "next-auth/providers/credentials";
// import bcrypt from "bcryptjs";

// import User from "@/models/User";
// import { connectDB } from "@/lib/mongodb";

// const handler = NextAuth({
//     providers: [
//         CredentialsProvider({
//             name: "credentials",

//             credentials: {
//                 email: { label: "email", type: "text" },
//                 password: { label: "password", type: "password" },
//             },

//             async authorize(credentials) {
//                 console.log("➡️ AUTH START");
//                 console.log("CREDENTIALS:", credentials);

//                 await connectDB();
//                 console.log("➡️ DB CONECTADO");

//                 if (!credentials?.email || !credentials?.password) {
//                     console.log("❌ CREDENCIAIS VAZIAS");
//                     return null;
//                 }

//                 const user = await User.findOne({ email: credentials.email });
//                 console.log("👤 USER:", user);

//                 if (!user) {
//                     console.log("❌ USUÁRIO NÃO ENCONTRADO");
//                     return null;
//                 }

//                 const ok = await bcrypt.compare(
//                     credentials.password,
//                     user.password
//                 );

//                 console.log("🔐 PASSWORD OK?", ok);

//                 if (!ok) {
//                     console.log("❌ SENHA INVÁLIDA");
//                     return null;
//                 }

//                 console.log("✅ LOGIN OK");

//                 return {
//                     id: user._id.toString(),
//                     name: user.nome,
//                     email: user.email,
//                     role: user.role,
//                 };
//             }
//         }),
//     ],

//     session: { strategy: "jwt" },

//     callbacks: {
//         jwt({ token, user }) {
//             if (user) token.role = (user as any).role;
//             return token;
//         },

//         session({ session, token }) {
//             if (session.user) {
//                 (session.user as any).role = token.role;
//             }
//             return session;
//         },
//     },
// });

// export { handler as GET, handler as POST };

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

        const user = await User.findOne({ email });

        console.log("ROLE BANCO:", user.role);

        return {
          id: user._id.toString(),
          name: user.nome,
          email: user.email,
          role: user.role,
        };



        // 1. Verifica se o usuário existe
        if (!user) return null;

        if (user.isAtivo === false) {
          throw new Error("Usuário inativo. Acesso negado.");
          // O NextAuth vai capturar esse erro e negar o login
        }

        // 3. Verifica se a senha confere
        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) return null;

        // Retorna os dados para criar a sessão
        return {
          id: user._id.toString(),
          name: user.nome,
          email: user.email,
          role: user.role,
          rememberMe: rememberMe === 'true',
        };


      },
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