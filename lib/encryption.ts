import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  console.warn(
    "⚠️  ENCRYPTION_KEY não definida no .env - criptografia desabilitada"
  );
}

/**
 * Criptografa um texto usando AES-256-CBC
 * @param texto - Texto a ser criptografado
 * @returns String no formato: "iv:encrypted"
 */
export function encryptSenha(texto: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY não configurada");
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );

  let encrypted = cipher.update(texto, "utf-8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

/**
 * Descriptografa um texto previamente criptografado
 * @param texto - String no formato: "iv:encrypted"
 * @returns Texto original descriptografado
 */
export function decryptSenha(texto: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY não configurada");
  }

  const parts = texto.split(":");
  if (parts.length !== 2) {
    throw new Error("Formato de criptografia inválido");
  }

  const iv = Buffer.from(parts[0], "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );

  let decrypted = decipher.update(Buffer.from(parts[1], "hex"));
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf-8");
}
