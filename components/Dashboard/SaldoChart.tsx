import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/utils/formatCurrency";

interface SaldoChartProps {
  data: Array<{
    mes: string;
    receitaPrevista: number;
    receitaRealizada: number;
    despesaPrevista: number;
    despesaPaga: number;
  }>;
}

export function SaldoChart({ data }: SaldoChartProps) {
  // Calcular saldo acumulado
  const dadosComSaldo = data.map((item, index) => ({
    mes: new Date(item.mes + "-01").toLocaleDateString("pt-BR", {
      month: "short",
      year: "2-digit",
    }),
    saldoEstimado: item.receitaPrevista - item.despesaPrevista,
    saldoRealizado: item.receitaRealizada - item.despesaPaga,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="text-xs font-bold text-gray-700">{payload[0].payload.mes}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-xs">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Evolução do Saldo</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={dadosComSaldo}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
          />
          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="saldoEstimado"
            stroke="#3b82f6"
            name="Saldo Estimado"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="saldoRealizado"
            stroke="#10b981"
            name="Saldo Realizado"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
