// Conversión entre la hora de pared de la clínica (Fortaleza) e instantes UTC.
// El proceso puede correr en cualquier zona (p. ej. servidores en EEUU), así que
// NUNCA dependemos de la hora local del proceso: el offset lo resuelve `Intl` a
// partir de la base de datos IANA, no un número fijo. Aislado aquí para que, si
// algún día Brasil reinstaura el horario de verano o cambia la sede, solo haya
// que tocar este archivo.

export const CLINIC_TZ = "America/Fortaleza";

export type WallClock = {
  y: number;
  m: number; // 1-12
  d: number;
  hour: number;
  minute: number;
  weekday: number; // 0 = domingo … 6 = sábado
};

// Offset de la zona (en ms, positivo al este de UTC) para un instante concreto.
// Renderiza el instante en la zona, lo reinterpreta como si fuera UTC y mide la
// diferencia. Es el patrón estándar para obtener el offset real (incluido DST).
function tzOffsetMs(instant: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: CLINIC_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") === 24 ? 0 : get("hour"),
    get("minute"),
    get("second")
  );
  return asUtc - instant.getTime();
}

// Instante UTC → componentes de la hora de pared en Fortaleza.
export function utcToWallClock(instant: Date): WallClock {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: CLINIC_TZ,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  const hour = Number(get("hour"));
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    y: Number(get("year")),
    m: Number(get("month")),
    d: Number(get("day")),
    hour: hour === 24 ? 0 : hour,
    minute: Number(get("minute")),
    weekday: weekdayMap[get("weekday")],
  };
}

// Hora de pared en Fortaleza → instante UTC.
// Partimos de la interpretación ingenua como UTC y corregimos con el offset real
// de esa fecha. Como Fortaleza no tiene DST el offset es estable, pero el método
// es correcto aunque lo tuviera.
export function wallClockToUtc(
  y: number,
  m: number, // 1-12
  d: number,
  hour: number,
  minute: number
): Date {
  const guess = Date.UTC(y, m - 1, d, hour, minute);
  const offset = tzOffsetMs(new Date(guess));
  return new Date(guess - offset);
}
