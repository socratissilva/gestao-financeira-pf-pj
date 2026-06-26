import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/utils/formatCurrency";

interface SaldoChartProps {
  data: Array<{
    mes: string;
    receitas: number;
    despesas: number;
    resultado: number;
  }>;
}

export function SaldoChart({ data }: SaldoChartProps) {
  const dadosComSaldo = data.map((item) => ({
    mes: item.mes, // mantém estável (YYYY-MM)

    mesFormatado: new Date(
      Number(item.mes.split("-")[0]),
      Number(item.mes.split("-")[1]) - 1,
      1
    ).toLocaleDateString("pt-BR", {
      month: "short",
      year: "2-digit",
    }),

    saldo: item.resultado,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="text-xs font-bold text-gray-700">
            {payload[0].payload.mes}
          </p>
          <p className="text-xs" style={{ color: payload[0].color }}>
            Saldo: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        Evolução do Saldo
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={dadosComSaldo}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="mesFormatado"
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
          />

          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />

          <Tooltip content={<CustomTooltip />} />

          <Line
            type="monotone"
            dataKey="saldo"
            stroke="#3b82f6"
            name="Saldo"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}