export function parseCents(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "0")
    .replace(/[^\d,.-]/g, "")
    .replace(".", "")
    .replace(",", ".");
  return Math.round(Number(normalized || 0) * 100);
}

export function formatBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
