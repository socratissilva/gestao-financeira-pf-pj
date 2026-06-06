// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/mongodb";
// import Receita from "@/models/Receita";

// export const runtime = "nodejs";

// export async function GET() {
//   try {
//     await connectDB();

//     const receitas = await Receita.find().sort({ data: -1 });

//     return NextResponse.json({ receitas });
//   } catch (error) {
//     console.error("GET ERROR:", error);

//     return NextResponse.json(
//       { message: "Erro ao buscar receitas" },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(req: Request) {
//   try {
//     await connectDB();

//     const body = await req.json();

//     const [mes, ano] = body.mesAno.split("-");
//     const data = new Date(Number(ano), Number(mes) - 1, 1);

//     const dataFim =
//       body.recorrente && body.mesAnoFim
//         ? (() => {
//             const [m, a] = body.mesAnoFim.split("-");
//             return new Date(Number(a), Number(m) - 1, 1);
//           })()
//         : null;

//     const novaReceita = await Receita.create({
//       data,
//       categoria: body.categoria,
//       valor: body.valor,
//       observacao: body.observacao ?? "",
//       recorrente: body.recorrente ?? false,
//       dataFim,
//       ativa: true,
//     });

//     return NextResponse.json(
//       {
//         message: "Receita cadastrada com sucesso",
//         receita: novaReceita,
//       },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("POST ERROR:", error);

//     return NextResponse.json(
//       {
//         message: "Erro ao cadastrar receita",
//         debug: String(error),
//       },
//       { status: 500 }
//     );
//   }
// }