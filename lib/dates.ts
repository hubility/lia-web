// Los inputs `date` / `datetime-local` mandan la hora de PARED de Fortaleza
// ("2026-06-02T14:30"). Se interpreta con `clinic-tz`, no con la zona del
// proceso (que en Vercel es UTC), para guardar el instante UTC correcto.
import { CLINIC_TZ, wallClockToUtc } from "@/lib/clinic-tz";

export function parseDate(value: FormDataEntryValue | null) {
  const text = String(value ?? "");
  if (!text) return new Date();
  const [y, m, d] = text.split("-").map(Number);
  return wallClockToUtc(y, m, d, 0, 0);
}

export function parseDateTime(value: FormDataEntryValue | null) {
  const text = String(value ?? "");
  if (!text) return new Date();
  const [datePart, timePart] = text.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = (timePart ?? "00:00").split(":").map(Number);
  return wallClockToUtc(y, m, d, hh, mm);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: CLINIC_TZ }).format(date);
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: CLINIC_TZ,
  }).format(date);
}
