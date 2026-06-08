/// Este arquivo é para centralizar as categorias de receitas previstas, garantindo consistência e facilidade de manutenção.    
export const CATEGORIAS = [
  { value: "RENDA_1", label: "Renda 1" },
  { value: "TICKET", label: "Ticket" },
  { value: "RENDA_2", label: "Renda 2" },
  { value: "DECIMO", label: "13º Salário" },
  { value: "FERIAS", label: "Férias" },
  { value: "RESGATE", label: "Resgate" },
  { value: "OUTROS", label: "Outros" },
] as const;

/**
 * Map para exibição rápida (tabela, detalhes, etc)
 */
export const CATEGORIAS_LABEL = Object.fromEntries(
  CATEGORIAS.map((c) => [c.value, c.label])
) as Record<string, string>;

/**
 * Tipagem opcional (vai te ajudar depois)
 */
export type CategoriaValue = (typeof CATEGORIAS)[number]["value"];