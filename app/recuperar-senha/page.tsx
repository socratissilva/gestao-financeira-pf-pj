// app/recuperar-senha/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

function RecuperarSenhaContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Erro ao redefinir senha.");
      } else {
        setMessage("Senha redefinida com sucesso! Redirecionando...");
        setTimeout(() => router.push("/"), 3000);
      }
    } catch (err) {
      setError("Erro de conexão.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return <div style={styles.container}>Token inválido ou ausente.</div>;
  }

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.logoContainer}>
            <Image src="/img/logo_padrao_V01.jpeg" alt="Logo" width={250} height={100} priority />
        </div>

        <h2 style={styles.title}>Nova Senha</h2>
        <p style={styles.subtitle}>Digite sua nova senha de acesso.</p>

        {error && <p style={styles.errorMessage}>{error}</p>}
        {message && <p style={styles.successMessage}>{message}</p>}

        <input
          type="password"
          placeholder="Nova Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Confirme a Nova Senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          style={styles.input}
        />

        <button type="submit" style={styles.button} disabled={isLoading}>
          {isLoading ? "Salvando..." : "Alterar Senha"}
        </button>
      </form>
    </div>
  );
}

// O Next.js exige Suspense para usar useSearchParams em Client Components
export default function RecuperarSenhaPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <RecuperarSenhaContent />
        </Suspense>
    );
}

// --- Estilos  ---
const styles: { [key: string]: React.CSSProperties } = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' },
  form: { display: 'flex', flexDirection: 'column', width: '350px', padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', gap: '15px' },
  logoContainer: { display: 'flex', justifyContent: 'center', marginBottom: '10px' },
  title: { fontSize: '1.25rem', fontWeight: 'bold', color: '#333', textAlign: 'center', margin: 0 },
  subtitle: { fontSize: '0.875rem', color: '#666', textAlign: 'center' },
  errorMessage: { color: 'red', fontSize: '14px', textAlign: 'center' },
  successMessage: { color: 'green', fontSize: '14px', textAlign: 'center' },
  input: { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' },
  button: { padding: '10px', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
};