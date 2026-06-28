import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";

interface ReceitaDespesaChartProps {
  data: Array<{
    mes: string;
    receitas: number;
    despesas: number;
    resultado: number;
  }>;
}

export function ReceitaDespesaChart({ data }: ReceitaDespesaChartProps) {
  const dadosFormatados = data.map((item) => {
    const [ano, mes] = item.mes.split("-").map(Number);

    return {
      ...item,
      mesFormatado: new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      }),
    };
  });

  const formatMoney = (value: number) =>
    value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-md">
          <p className="font-bold text-xs mb-2">
            {payload[0].payload.mesFormatado}
          </p>

          {payload.map((entry: any, i: number) => (
            <p key={i} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {formatMoney(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  const isSingleMonth = dadosFormatados.length === 1;

  const barSize = isSingleMonth ? 60 : 22;

  return (
    <div className="bg-white rounded-xl p-6 border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          Receita vs Despesa vs Resultado
        </h3>

        <div className="flex gap-3 text-xs">
          <span className="text-green-600 font-semibold">■ Receita</span>
          <span className="text-red-500 font-semibold">■ Despesa</span>
          <span className="text-blue-500 font-semibold">■ Resultado</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={dadosFormatados}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="mesFormatado"
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
          />

          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            tickFormatter={(value: number) =>
              value.toLocaleString("pt-BR")
            }
          />

          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {/* BARRAS */}
          <Bar
            dataKey="receitas"
            name="Receita"
            fill="#22c55e"
            radius={[6, 6, 0, 0]}
            barSize={barSize}
          />

          <Bar
            dataKey="despesas"
            name="Despesa"
            fill="#ef4444"
            radius={[6, 6, 0, 0]}
            barSize={barSize}
          />

          {/* LINHA (resultado) */}
          <Line
            type="monotone"
            dataKey="resultado"
            name="Resultado"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}