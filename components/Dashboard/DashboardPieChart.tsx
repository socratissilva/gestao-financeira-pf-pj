import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  title: string;
  colors?: string[];
}

const CORES_PADRAO = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

export function DashboardPieChart({
  data,
  title,
  colors = CORES_PADRAO,
}: PieChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const valor = payload[0].value;
      const total = data.reduce((acc, item) => acc + item.value, 0);
      const percentual = ((valor / total) * 100).toFixed(1);

      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="text-xs font-bold text-gray-700">{payload[0].name}</p>
          <p className="text-xs text-gray-600">
            R$ {valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500">{percentual}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => {
                const total = data.reduce((acc, item) => acc + item.value, 0);
                const percentual = ((entry.value / total) * 100).toFixed(0);
                return `${percentual}%`;
              }}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          Sem dados para exibir
        </div>
      )}
    </div>
  );
}
