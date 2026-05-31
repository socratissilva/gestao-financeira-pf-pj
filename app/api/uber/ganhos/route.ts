// app/api/uber/ganhos/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import GanhoUber from "@/models/ganhoUber";

export async function POST(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Usuário não autenticado",
        },
        {
          status: 401,
        }
      );
    }

    const body = await req.json();

    const ganho = await GanhoUber.create({
      ...body,
      userId: session.user.id,
    });

    return NextResponse.json(
      {
        success: true,
        ganho,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao cadastrar ganho",
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

if (!session?.user?.id) {
  return NextResponse.json(
    {
      success: false,
      message: "Usuário não autenticado",
    },
    {
      status: 401,
    }
  );
}

const ganhos = await GanhoUber.find({
  userId: session.user.id,
}).sort({
  data: -1,
});

    return NextResponse.json({
      success: true,
      ganhos,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao buscar ganhos",
      },
      {
        status: 500,
      }
    );
  }
}