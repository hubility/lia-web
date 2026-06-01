const CHART_COUNT = 8;

export function procedureColorVar(seed: string | null | undefined): string {
  if (!seed) return "var(--muted-foreground)";
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % CHART_COUNT;
  return `var(--chart-${index + 1})`;
}
