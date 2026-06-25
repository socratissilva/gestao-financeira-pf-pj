import { formatCurrency } from "@/utils/formatCurrency";

interface KPICardProps {
  titulo: string;
  valor: number;
  mudanca?: number;
  tipo?: "positivo" | "negativo" | "neutro";
  icon?: React.ReactNode;
}

export function KPICard({
  titulo,
  valor,
  mudanca,
  tipo = "neutro",
  icon,
}: KPICardProps) {
  const cor =
    tipo === "positivo"
      ? "text-green-600"
      : tipo === "negativo"
        ? "text-red-600"
        : "text-blue-600";

  const bgCor =
    tipo === "positivo"
      ? "bg-green-50"
      : tipo === "negativo"
        ? "bg-red-50"
        : "bg-blue-50";

  return (
    <div className={`${bgCor} rounded-lg p-6 border border-gray-200`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{titulo}</p>
          <p className={`text-2xl font-bold mt-2 ${cor}`}>
            {formatCurrency(valor)}
          </p>
          {mudanca !== undefined && (
            <p
              className={`text-xs mt-2 ${
                mudanca >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {mudanca >= 0 ? "+" : ""}{mudanca.toFixed(1)}%
            </p>
          )}
        </div>
        {icon && <div className={`text-3xl ${cor}`}>{icon}</div>}
      </div>
    </div>
  );
}
