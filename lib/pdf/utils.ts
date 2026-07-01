export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export function formatBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function calcAge(birthDate: Date | null | undefined, ref: Date = new Date()): number | null {
  if (!birthDate) return null;
  let age = ref.getFullYear() - birthDate.getFullYear();
  const monthDiff = ref.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}
