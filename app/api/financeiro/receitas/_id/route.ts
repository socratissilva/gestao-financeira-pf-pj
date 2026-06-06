// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/mongodb";
// import Receita from "@/models/receita";

// export const runtime = "nodejs";

// /* ======================================
//    GET
// ====================================== */
// export async function GET(
//     req: Request,
//     { params }: { params: { id: string } }
// ) {
//     try {
//         await connectDB();

//         const { id } = params;

//         const receita = await Receita.findById(id);

//         if (!receita) {
//             return NextResponse.json(
//                 { message: "Receita não encontrada" },
//                 { status: 404 }
//             );
//         }

//         return NextResponse.json({ receita });

//     } catch (error) {
//         console.error("GET RECEITA ERROR:", error);

//         return NextResponse.json(
//             { message: "Erro ao buscar receita" },
//             { status: 500 }
//         );
//     }
// }

// /* ======================================
//    PUT (MÊS/ANO)
// ====================================== */
// export async function PUT(
//     req: Request,
//     { params }: { params: { id: string } }
// ) {
//     try {
//         await connectDB();

//         const { id } = params;
//         const body = await req.json();

//         // 🔥 converte mês/ano → Date
//         const [mes, ano] = body.mesAno.split("-");
//         const data = new Date(Number(ano), Number(mes) - 1, 1);

//         const dataFim =
//             body.recorrente && body.mesAnoFim
//                 ? (() => {
//                       const [m, a] = body.mesAnoFim.split("-");
//                       return new Date(Number(a), Number(m) - 1, 1);
//                   })()
//                 : null;

//         const receita = await Receita.findByIdAndUpdate(
//             id,
//             {
//                 data,
//                 categoria: body.categoria,
//                 valor: body.valor,
//                 observacao: body.observacao ?? "",
//                 recorrente: body.recorrente ?? false,
//                 dataFim,
//             },
//             {
//                 new: true,
//                 runValidators: true,
//             }
//         );

//         if (!receita) {
//             return NextResponse.json(
//                 { message: "Receita não encontrada" },
//                 { status: 404 }
//             );
//         }

//         return NextResponse.json({
//             message: "Receita atualizada com sucesso",
//             receita,
//         });

//     } catch (error) {
//         console.error("PUT RECEITA ERROR:", error);

//         return NextResponse.json(
//             { message: "Erro ao atualizar receita" },
//             { status: 500 }
//         );
//     }
// }

// /* ======================================
//    DELETE
// ====================================== */
// export async function DELETE(
//     req: Request,
//     { params }: { params: { id: string } }
// ) {
//     try {
//         await connectDB();

//         const { id } = params;

//         const receita = await Receita.findByIdAndDelete(id);

//         if (!receita) {
//             return NextResponse.json(
//                 { message: "Receita não encontrada" },
//                 { status: 404 }
//             );
//         }

//         return NextResponse.json({
//             message: "Receita excluída com sucesso",
//         });

//     } catch (error) {
//         console.error("DELETE RECEITA ERROR:", error);

//         return NextResponse.json(
//             { message: "Erro ao excluir receita" },
//             { status: 500 }
//         );
//     }
// }