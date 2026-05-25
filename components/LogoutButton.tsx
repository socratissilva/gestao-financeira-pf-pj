// components/LogoutButton.tsx
"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      // O callbackUrl garante que, após limpar o cookie, o usuário vá para a tela de login
      onClick={() => signOut({ callbackUrl: '/login' })}
      style={{
        marginTop: '20px',
        padding: '10px 20px',
        backgroundColor: '#dc3545',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold'
      }}
    >
      Sair do Sistema
    </button>
  );
}