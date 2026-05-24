import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI!;

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);

    console.log("MongoDB conectado");

    const UserSchema = new mongoose.Schema({
      nome: String,
      email: String,
      password: String,
      ativo: Boolean,
    });

    const User =
      mongoose.models.User || mongoose.model("User", UserSchema);

    const hashedPassword = await bcrypt.hash("123456", 10);

    const existingUser = await User.findOne({
      email: "admin@email.com",
    });

    if (existingUser) {
      console.log("Usuário admin já existe");
      process.exit();
    }

    await User.create({
      nome: "Administrador",
      email: "admin@email.com",
      password: hashedPassword,
      ativo: true,
    });

    console.log("Admin criado com sucesso");
    process.exit();

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

createAdmin();