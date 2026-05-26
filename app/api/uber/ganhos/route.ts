import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import GanhoUber from "@/models/ganhoUber";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const ganho = await GanhoUber.create(body);

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

    const ganhos = await GanhoUber.find().sort({
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