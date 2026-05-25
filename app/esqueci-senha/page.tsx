// app/esqueci-senha/page.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      // chamada para API de envio de e-mail
      const res = await fetch("/api/auth/esqueci-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Ocorreu um erro ao tentar recuperar a senha.");
      } else {
        setMessage("Se o e-mail existir em nossa base, um link de recuperação será enviado.");
      }
    } catch (err) {
      setError("Erro de conexão. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.logoContainer}>
          <div style={styles.logoWrapper}>
            <Image 
              src="/img/logo_padrao_V01.jpeg" 
              alt="Logo da Empresa" 
              width={250} 
              height={100}  
              priority 
            />
          </div>
        </div>

        <h2 style={styles.title}>Recuperar Senha</h2>
        <p style={styles.subtitle}>
          Digite seu e-mail e enviaremos um link para você redefinir sua senha.
        </p>

        {error && <p style={styles.errorMessage}>{error}</p>}
        {message && <p style={styles.successMessage}>{message}</p>}
        
        <input
          type="email"
          placeholder="Seu e-mail cadastrado"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
          disabled={isLoading}
        />
        
        <button type="submit" style={styles.button} disabled={isLoading}>
          {isLoading ? "Enviando..." : "Enviar link de recuperação"}
        </button>

        <div style={styles.linkContainer}>
          <Link href="/" style={styles.link}>
            Voltar para o Login
          </Link>
        </div>
      </form>
    </div>
  );
}

// --- Estilos ---
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f0f2f5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    width: '350px',
    padding: '2rem',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    gap: '15px',
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '10px',
  },
  logoWrapper: {
    display: 'inline-block',
    lineHeight: 0,
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    margin: '0',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#666',
    textAlign: 'center',
    marginBottom: '10px',
  },
  errorMessage: { color: 'red', fontSize: '14px', margin: 0, textAlign: 'center' },
  successMessage: { color: 'green', fontSize: '14px', margin: 0, textAlign: 'center' },
  input: {
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    color: '#333',
    backgroundColor: '#fff',
    outline: 'none',
  },
  button: {
    padding: '10px',
    backgroundColor: '#0070f3',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
    marginTop: '5px',
  },
  linkContainer: {
    textAlign: 'center',
    marginTop: '10px',
  },
  link: {
    color: '#0070f3',
    textDecoration: 'none',
    fontSize: '14px',
  }
};