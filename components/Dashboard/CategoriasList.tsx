import { useState } from "react";
import { formatCurrency } from "@/utils/formatCurrency";

interface CategoriasListaProps {
  dados: Array<{
    name: string;
    value: number;
  }>;
  opcoesFiltro?: Array<{
    name: string;
    value: number;
  }>;
  titulo: string;
  limite?: number;
}

export function CategoriasList({
  dados,
  opcoesFiltro,
  titulo,
  limite = 5,
}: CategoriasListaProps) {
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const categoriasDisponiveis = opcoesFiltro ?? dados;
  const filtroAtivo = categoriasDisponiveis.some(
    (item) => item.name === categoriaSelecionada
  );
  const dadosOrdenados = filtroAtivo
    ? categoriasDisponiveis.filter(
        (item) => item.name === categoriaSelecionada
      )
    : dados.slice(0, limite);
  const total = categoriasDisponiveis.reduce(
    (acc, item) => acc + item.value,
    0
  );

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-bold text-gray-800">{titulo}</h3>
        {opcoesFiltro && (
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <span className="shrink-0">Categoria:</span>
            <select
              aria-label="Selecionar categoria de despesa"
              value={filtroAtivo ? categoriaSelecionada : ""}
              onChange={(event) => setCategoriaSelecionada(event.target.value)}
              className="min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Top {limite} categorias</option>
              {categoriasDisponiveis.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="space-y-3">
        {dadosOrdenados.length > 0 ? (
          dadosOrdenados.map((item, index) => {
            const percentual =
              total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
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
