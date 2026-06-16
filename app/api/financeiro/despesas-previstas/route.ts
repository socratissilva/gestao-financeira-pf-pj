// app/api/financeiro/despesas-previstas/route.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import DespesaPrevista from "@/models/DespesaPrevista";
import "@/models/cartao";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();

    const session =
      await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Não autenticado",
        },
        {
          status: 401,
        }
      );
    }

    const despesas_previstas =
      await DespesaPrevista.find({
        userId: session.user.id,
      })
        .populate("cartaoId")
        .sort({
          mesAno: -1,
        })
        .lean();

    return NextResponse.json({
      success: true,
      despesas_previstas,
    });

  } catch (error) {
    console.error(
      "Erro ao buscar despesas:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Erro ao buscar despesas",
      },
      {
        status: 500,
      }
    );
  }
}
export async function POST(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Não autenticado",
        },
        {
          status: 401,
        }
      );
    }

    const body = await req.json();

    const {
      mesAno,
      mesAnoFim,
      recorrente,
      categoria,
      valor,
      valorPago,
      dataPagamento,
      dataVencimento,
      formaPagamento,
      cartaoId,
      observacao,
    } = body;


    function gerarMeses(inicio: string, fim: string) {
      const meses: string[] = [];

      let [ano, mes] = inicio.split("-").map(Number);
      const [anoFim, mesFim] = fim.split("-").map(Number);

      while (
        ano < anoFim ||
        (ano === anoFim && mes <= mesFim)
      ) {
        meses.push(
          `${ano}-${String(mes).padStart(2, "0")}`
        );

        mes++;

        if (mes > 12) {
          mes = 1;
          ano++;
        }
      }

      return meses;
    }

    // ==================================================
    // NÃO RECORRENTE
    // ==================================================
    if (!recorrente) {
      const [anoMes, mesMes] = mesAno
        .split("-")
        .map(Number);

      const despesa = await DespesaPrevista.create({
        userId: session.user.id,

        mesAno: new Date(
          anoMes,
          mesMes - 1,
          1
        ),

        categoria,

        valor: Number(valor),

        valorPago:
          valorPago !== null &&
            valorPago !== undefined &&
            valorPago !== ""
            ? Number(valorPago)
            : null,

        dataPagamento:
          dataPagamento || null,

        dataVencimento: dataVencimento
          ? new Date(
            `${dataVencimento}T12:00:00`
          )
          : null,

        formaPagamento,

        cartaoId:
          formaPagamento === "CREDITO" &&
            cartaoId
            ? new mongoose.Types.ObjectId(
              cartaoId
            )
            : null,

        observacao,

        recorrente: false,

        mesAnoFim: null,

        ativa: true,
      });

      return NextResponse.json({
        success: true,
        despesa,
      });
    }

    // ==================================================
    // RECORRENTE
    // ==================================================

    if (recorrente && !mesAnoFim) {
      console.error(
        "ERRO: recorrente=true mas mesAnoFim não foi informado"
      );

      return NextResponse.json(
        {
          success: false,
          message: "mesAnoFim não informado",
        },
        {
          status: 400,
        }
      );
    }
    const meses = gerarMeses(
      mesAno,
      mesAnoFim
    );


    const inserts = meses.map((m) => {
      const [ano, mes] = m
        .split("-")
        .map(Number);

      let vencimentoFinal = null;

      if (dataVencimento) {
        const partes =
          dataVencimento.split("-");

        const dia = Number(partes[2]);

        vencimentoFinal = new Date(
          ano,
          mes - 1,
          dia,
          12,
          0,
          0
        );
      }

      return {
        userId: session.user.id,

        mesAno: new Date(
          ano,
          mes - 1,
          1
        ),

        categoria,

        valor: Number(valor),

        valorPago: null,

        dataPagamento: null,

        dataVencimento: vencimentoFinal,

        formaPagamento,

        cartaoId:
          formaPagamento === "CREDITO" &&
            cartaoId
            ? new mongoose.Types.ObjectId(
              cartaoId
            )
            : null,

        observacao,

        recorrente: true,

        mesAnoFim: (() => {
          const [anoFim, mesFim] =
            mesAnoFim
              .split("-")
              .map(Number);

          return new Date(
            anoFim,
            mesFim - 1,
            1
          );
        })(),

        ativa: true,
      };
    });

    try {
      const despesasCriadas =
        await DespesaPrevista.insertMany(
          inserts,
          {
            ordered: false,
          }
        );
      return NextResponse.json({
        success: true,
        despesas: despesasCriadas,
        totalCriados:
          despesasCriadas.length,
      });
    } catch (error: any) {
      console.error(
        "INSERT MANY ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            error?.message ||
            "Erro ao inserir recorrências",

          writeErrors:
            error?.writeErrors || [],
        },
        {
          status: 500,
        }
      );
    }
  } catch (error) {
    console.error(
      "Erro ao cadastrar despesa:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Erro ao cadastrar despesa",
      },
      {
        status: 500,
      }
    );
  }
}