import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CATEGORIAS_DESPESA_LABEL } from "@/constants/categorias-despesas";
import { formatCurrency } from "@/utils/formatCurrency";

interface DashboardCategoryEvolutionChartProps {
  categoria: string;
  data: Array<{
    mes: string;
    valor: number;
  }>;
}

function formatMonth(mes: string) {
  const [ano, numeroMes] = mes.split("-").map(Number);
  return new Date(ano, numeroMes - 1).toLocaleDateString("pt-BR", {
    month: "short",
    year: "2-digit",
  });
}

export function DashboardCategoryEvolutionChart({
  categoria,
  data,
}: DashboardCategoryEvolutionChartProps) {
  const categoriaLabel = CATEGORIAS_DESPESA_LABEL[categoria] ?? categoria;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-bold text-gray-800">
        Evolução de {categoriaLabel}
      </h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="mes"
              tickFormatter={formatMonth}
              tick={{ fontSize: 11 }}
              angle={-35}
              textAnchor="end"
              height={55}
              stroke="#9ca3af"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value: number) => value.toLocaleString("pt-BR")}
              stroke="#9ca3af"
            />
            <Tooltip
              labelFormatter={(mes) => formatMonth(String(mes))}
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Bar
              dataKey="valor"
              name={categoriaLabel}
              fill="#ef4444"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[300px] items-center justify-center text-gray-500">
          Sem dados para exibir
        </div>
      )}
    </div>
  );
}
