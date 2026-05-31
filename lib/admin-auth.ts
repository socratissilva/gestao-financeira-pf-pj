// lib/admin-auth.ts
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";

/**
 * Verifica se o usuário é ADMIN
 * Se não for, redireciona para login/home
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userSession = session.user as any;
  if (userSession.role !== "ADMIN") {
    redirect("/");
  }

  return session;
}

/**
 * Hook para páginas que precisam de proteção ADMIN
 * Use isso no layout.tsx das rotas /admin
 */
export async function withAdminProtection(
  callback: (session: any) => Promise<React.ReactNode>
) {
  const session = await requireAdmin();
  return callback(session);
}
