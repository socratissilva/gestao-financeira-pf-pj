import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// LISTAR USUÁRIOS
export async function GET() {
  try {

    const session = await getServerSession(authOptions);

    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Acesso negado" },
        { status: 403 }
      );
    }
    await connectDB();

    const usuarios = await User.find({})
      .select("-password")
      .sort({ nome: 1 });

    return NextResponse.json({
      success: true,
      usuarios,
    });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao listar usuários",
      },
      { status: 500 }
    );
  }
}

// CRIAR USUÁRIO
export async function POST(req: Request) {
  try {

    const session = await getServerSession(authOptions);

    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Acesso negado" },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await req.json();

    const {
      nome,
      email,
      password,
      role = "PADRAO",
    } = body;

    if (!nome || !email || !password) {
      return NextResponse.json(
        {
          message: "Nome, email e senha são obrigatórios",
        },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      email: email,
    }).lean();

    if (user) {
      return NextResponse.json(
        {
          message: "Já existe usuário com este e-mail",
        },
        { status: 400 }
      );
    }

    const senhaHash = await bcrypt.hash(password, 10);

    const novoUsuario = await User.create({
      nome,
      email,
      password: senhaHash,
      role,
      isAtivo: true,
    });

    return NextResponse.json(
      {
        success: true,
        usuario: {
          _id: novoUsuario._id,
          nome: novoUsuario.nome,
          email: novoUsuario.email,
          role: novoUsuario.role,
          isAtivo: novoUsuario.isAtivo,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar usuário:", error);

    return NextResponse.json(
      {
        message: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}