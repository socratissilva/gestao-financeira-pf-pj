import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ReceitaDespesaChartProps {
  data: Array<{
    mes: string;
    receitaPrevista: number;
    receitaRealizada: number;
    despesaPrevista: number;
    despesaPaga: number;
  }>;
}

export function ReceitaDespesaChart({ data }: ReceitaDespesaChartProps) {
  // Formatar datas para melhor visualização
  const dadosFormatados = data.map((item) => ({
    ...item,
    mesFormatado: new Date(item.mes + "-01").toLocaleDateString("pt-BR", {
      month: "short",
      year: "2-digit",
    }),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="text-xs font-bold text-gray-700">
            {payload[0].payload.mesFormatado}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-xs">
              {entry.name}: R$ {(entry.value || 0).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        Receitas vs Despesas
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={dadosFormatados}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="mesFormatado"
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
          />
          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            dataKey="receitaPrevista"
            fill="#10b981"
            name="Receita Prevista"
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="receitaRealizada"
            fill="#059669"
            name="Receita Realizada"
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="despesaPrevista"
            fill="#ef4444"
            name="Despesa Prevista"
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="despesaPaga"
            fill="#991b1b"
            name="Despesa Paga"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
