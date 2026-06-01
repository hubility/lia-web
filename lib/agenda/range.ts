export type AgendaView = "day" | "week" | "month";

export function parseAgendaView(value: string | undefined): AgendaView {
  return value === "day" || value === "month" ? value : "week";
}

export function parseAgendaDate(value: string | undefined): Date {
  if (!value) return startOfDay(new Date());
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return startOfDay(new Date());
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

export function formatIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

export function endOfWeek(date: Date): Date {
  return endOfDay(addDays(startOfWeek(date), 5));
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function weekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 6 }, (_, i) => addDays(start, i));
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function rangeFor(view: AgendaView, date: Date): { from: Date; to: Date } {
  if (view === "day") return { from: startOfDay(date), to: endOfDay(date) };
  if (view === "month") return { from: startOfMonth(date), to: endOfMonth(date) };
  return { from: startOfWeek(date), to: endOfWeek(date) };
}
