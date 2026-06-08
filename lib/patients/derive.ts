type QuoteValue = { discountCents: number; lines: { totalPriceCents: number }[] };

/** Valor de un orçamento en centavos: suma de líneas menos descuento (mínimo 0). */
export function quoteValueCents(quote: QuoteValue): number {
  const linesTotal = quote.lines.reduce((sum, line) => sum + line.totalPriceCents, 0);
  return Math.max(linesTotal - quote.discountCents, 0);
}

/** Edad en años cumplidos a partir de la fecha de nacimiento. */
export function calculateAge(birthDate: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
