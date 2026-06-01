export const SNAP_MINUTES = 15;
export const PX_PER_HOUR = 48;
export const PX_PER_MINUTE = PX_PER_HOUR / 60;
export const HOUR_START = 8;
export const HOUR_END = 18;
export const HOURS = HOUR_END - HOUR_START;
export const GRID_HEIGHT = HOURS * PX_PER_HOUR;
export const MIN_DURATION_MINUTES = 15;

export type DragAction = "move" | "resize";
export type DragKind = "appointment" | "timeblock";

export type DragId = {
  kind: DragKind;
  id: string;
  action: DragAction;
};

export function buildDragId(d: DragId): string {
  return `${d.kind}::${d.id}::${d.action}`;
}

export function parseDragId(s: string): DragId | null {
  const parts = s.split("::");
  if (parts.length !== 3) return null;
  const [kind, id, action] = parts;
  if (kind !== "appointment" && kind !== "timeblock") return null;
  if (action !== "move" && action !== "resize") return null;
  if (!id) return null;
  return { kind, id, action };
}

function isoDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function buildDayDropId(date: Date): string {
  return `day::${isoDay(date)}`;
}

export function parseDayDropId(s: string): Date | null {
  if (!s.startsWith("day::")) return null;
  const iso = s.slice(5);
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

export function snapMinutes(minutes: number): number {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

export function minutesFromHourStart(date: Date): number {
  return (date.getHours() - HOUR_START) * 60 + date.getMinutes();
}

export function applyMinutesToDay(day: Date, minutesFromStart: number): Date {
  const total = HOUR_START * 60 + minutesFromStart;
  const d = new Date(day);
  d.setHours(Math.floor(total / 60), total % 60, 0, 0);
  return d;
}
