export function formatDateBR(date?: string | Date | null) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
}