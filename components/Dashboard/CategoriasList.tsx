import { formatCurrency } from "@/utils/formatCurrency";

interface CategoriasListaProps {
  dados: Array<{
    name: string;
    value: number;
  }>;
  titulo: string;
  limite?: number;
}

export function CategoriasList({ dados, titulo, limite = 5 }: CategoriasListaProps) {
  const dadosOrdenados = dados.slice(0, limite);
  const total = dados.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-4">{titulo}</h3>
      <div className="space-y-3">
        {dadosOrdenados.length > 0 ? (
          dadosOrdenados.map((item, index) => {
            const percentual = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{item.name}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                      style={{ width: `${percentual}%` }}
                    />
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(item.value)}
                  </p>
                  <p className="text-xs text-gray-500">{percentual}%</p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 text-sm">Sem dados para exibir</p>
        )}
      </div>
    </div>
  );
}
