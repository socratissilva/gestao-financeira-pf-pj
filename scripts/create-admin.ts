import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

// Garante a leitura do .env na raiz do projeto
const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function createAdmin() {
  try {
    // Logs de depuração
    console.log("URL do Banco encontrada?", !!MONGODB_URI);
    console.log("Senha do Admin encontrada?", !!ADMIN_PASSWORD);

    if (!ADMIN_PASSWORD || !MONGODB_URI) {
      console.error("Erro: Variáveis de ambiente não foram carregadas corretamente.");
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB conectado com sucesso!");

    // Definição do Schema local para o script
    const UserSchema = new mongoose.Schema({
      nome: String,
      email: String,
      password: String,
      isAtivo: Boolean,
      role: String,
    });

    // Reaproveita o modelo se ele já existir, caso contrário cria um novo
    const User = mongoose.models.User || mongoose.model("User", UserSchema);

    // Criptografa a senha vinda do .env
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Verifica se o admin@email.com já existe na base
    const existingUser = await User.findOne({
      email: "admin@email.com",
    });

    if (existingUser) {
      existingUser.password = hashedPassword;
      existingUser.role = "ADMIN";
      existingUser.isAtivo = true;

      await existingUser.save();
    }

    // Cria o usuário com a nova senha criptografada
    await User.create({
      nome: "Administrador",
      email: "admin@email.com",
      password: hashedPassword,
      isAtivo: true,
      role: "ADMIN",
    });

    console.log("Admin criado com sucesso!");
    process.exit(0);

  } catch (error) {
    console.error("Erro ao rodar o script de admin:", error);
    process.exit(1);
  }
}

// Executa a função
createAdmin();