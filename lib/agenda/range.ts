// Toda la aritmética de fechas razona en hora de pared de Fortaleza vía
// `clinic-tz`, NUNCA en la hora local del proceso. Así el cálculo de rangos y
// bordes es idéntico corra en el navegador (UTC−3) o en Vercel (UTC).
import { utcToWallClock, wallClockToUtc } from "@/lib/clinic-tz";

export type AgendaView = "day" | "week" | "month";

export function parseAgendaView(value: string | undefined): AgendaView {
  return value === "day" || value === "month" ? value : "week";
}

export function parseAgendaDate(value: string | undefined): Date {
  if (!value) return startOfDay(new Date());
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return startOfDay(new Date());
  const [y, m, d] = parts;
  return wallClockToUtc(y, m, d, 0, 0);
}

export function formatIsoDate(date: Date): string {
  const w = utcToWallClock(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${w.y}-${pad(w.m)}-${pad(w.d)}`;
}

export function startOfDay(date: Date): Date {
  const w = utcToWallClock(date);
  return wallClockToUtc(w.y, w.m, w.d, 0, 0);
}

export function endOfDay(date: Date): Date {
  const w = utcToWallClock(date);
  return new Date(wallClockToUtc(w.y, w.m, w.d, 23, 59).getTime() + 59_999);
}

export function addDays(date: Date, days: number): Date {
  const w = utcToWallClock(date);
  // Anclamos a mediodía para cruzar el día sin tocar bordes, luego releemos.
  const shifted = utcToWallClock(new Date(Date.UTC(w.y, w.m - 1, w.d + days, 12)));
  return wallClockToUtc(shifted.y, shifted.m, shifted.d, w.hour, w.minute);
}

export function startOfWeek(date: Date): Date {
  const w = utcToWallClock(date);
  const diff = w.weekday === 0 ? -6 : 1 - w.weekday;
  return addDays(wallClockToUtc(w.y, w.m, w.d, 0, 0), diff);
}

export function endOfWeek(date: Date): Date {
  return endOfDay(addDays(startOfWeek(date), 5));
}

export function startOfMonth(date: Date): Date {
  const w = utcToWallClock(date);
  return wallClockToUtc(w.y, w.m, 1, 0, 0);
}

export function endOfMonth(date: Date): Date {
  const w = utcToWallClock(date);
  // Día 0 del mes siguiente = último día del mes actual (anclado a mediodía).
  const last = utcToWallClock(new Date(Date.UTC(w.y, w.m, 0, 12)));
  return endOfDay(wallClockToUtc(last.y, last.m, last.d, 0, 0));
}

export function weekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 6 }, (_, i) => addDays(start, i));
}

export function isSameDay(a: Date, b: Date): boolean {
  const wa = utcToWallClock(a);
  const wb = utcToWallClock(b);
  return wa.y === wb.y && wa.m === wb.m && wa.d === wb.d;
}

export function rangeFor(view: AgendaView, date: Date): { from: Date; to: Date } {
  if (view === "day") return { from: startOfDay(date), to: endOfDay(date) };
  if (view === "month") return { from: startOfMonth(date), to: endOfMonth(date) };
  return { from: startOfWeek(date), to: endOfWeek(date) };
}
