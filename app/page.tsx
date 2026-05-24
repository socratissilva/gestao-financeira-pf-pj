"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false); 
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError("Erro ao fazer login");
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        
        {/* Bloco Superior da Logo */}
        <div style={styles.logoContainer}>
          <div style={styles.logoWrapper}>
            <Image 
              src="/img/logo.PNG" 
              alt="Logo Sócratis" 
              width={280} 
              height={140}  
              style={{ objectFit: 'contain', height: 'auto' }}
              priority 
            />
          </div>
        </div>

        {error && <p style={styles.errorMessage}>{error}</p>}
        
        {/* Input de Email */}
        <div style={styles.inputGroup}>
          <label style={styles.inputLabel}>EMAIL</label>
          <input
            type="email"
            placeholder="admin@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        
        {/* Input de Senha */}
        <div style={styles.inputGroup}>
          <label style={styles.inputLabel}>SENHA</label>
          <input
            type="password"
            placeholder="........"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
        </div>

        {/* Checkbox */}
        <label style={styles.checkboxContainer}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={styles.checkbox}
          />
          Manter-me conectado
        </label>
        
        {/* Botão Principal */}
        <button type="submit" style={styles.button}>
          Acessar Sistema
        </button>

        {/* Link Esqueci a Senha */}
        <div style={styles.forgotPasswordContainer}>
          <a href="/esqueci-senha" style={styles.forgotPasswordLink}>
            Esqueceu a senha?
          </a>
        </div>

        {/* Slogan de Rodapé */}
        <div style={styles.footerSlogan}>
          CONTROLE, PLANEJE, CRESÇA.
        </div>
      </form>
    </div>
  );
}

// --- CSS In-JS com a Paleta de Cores do Modelo ---
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#e1e5e2', 
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    width: '410px', 
    padding: '2.5rem 2rem',
    backgroundColor: '#f4f4ee', // Fundo off-white do modelo
    borderRadius: '16px',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.05)', 
    gap: '16px',
    border: '1px solid #e3e3db',
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '5px',
  },
  logoWrapper: {
    display: 'inline-block',
    lineHeight: 0,
    backgroundColor: 'transparent', 
  },
  errorMessage: {
    color: '#dc2626',
    fontSize: '14px',
    margin: 0,
    textAlign: 'center',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  inputLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#2d4a3e', 
    paddingLeft: '4px',
    letterSpacing: '0.5px',
  },
  input: {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1.5px solid #b5945b', // Borda bronze
    color: '#2d4a3e',
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: '15px',
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '8px',
    fontSize: '14px',
    color: '#4a6b5d',
    cursor: 'pointer',
    margin: '4px 0 8px 0',
  },
  checkbox: {
    cursor: 'pointer',
    accentColor: '#2d4a3e', 
  },
  button: {
    padding: '14px',
    backgroundColor: '#1b3227', // Botão verde escuro
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '14px',
    textTransform: 'uppercase', 
    letterSpacing: '1px',
    boxShadow: '0 4px 10px rgba(27, 50, 39, 0.2)',
  },
  forgotPasswordContainer: {
    textAlign: 'center',
    width: '100%',
    marginTop: '4px',
  },
  forgotPasswordLink: {
    fontSize: '12px',
    color: '#b5945b', 
    textDecoration: 'none',
    fontWeight: '600',
    textTransform: 'uppercase', 
    letterSpacing: '0.5px',
  },
  footerSlogan: {
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: '700',
    color: '#2d4a3e', 
    letterSpacing: '1.5px',
    marginTop: '15px',
    borderTop: '1px solid #e3e3db',
    paddingTop: '15px',
  }
};