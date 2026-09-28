export const MODULOS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "organizacao", label: "Organização" },
  { key: "financeiro", label: "Financeiro" },
  { key: "uber", label: "Uber" },
  { key: "investimentos", label: "Investimentos" },
  { key: "cadastro", label: "Cadastros" },
] as const;

export type ModuloAcesso = (typeof MODULOS)[number]["key"];

export const MODULOS_LEGADOS: ModuloAcesso[] = [
  "dashboard",
  "financeiro",
  "uber",
  "investimentos",
  "cadastro",
];

export function isModuloAcesso(value: unknown): value is ModuloAcesso {
  return MODULOS.some((modulo) => modulo.key === value);
}