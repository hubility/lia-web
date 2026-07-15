import { findCollision } from "@/lib/agenda/collision";
import { formatClockMinutes } from "@/lib/agenda/schedule";
import { getClinicSchedule } from "@/lib/clinic/schedule";
import { utcToWallClock, wallClockToUtc } from "@/lib/clinic-tz";
import { listAppointments } from "@/lib/modules/appointments/service";
import { listTimeBlocks } from "@/lib/modules/timeblocks/service";

// Única fuente de verdad para "¿se puede agendar aquí?". La usa la API del agente
// (y puede reusarla la web). Valida horario de Fortaleza + ausencia de solapes.
// Validación simple (sin transacción): suficiente para un consultorio de un
// dentista; se puede endurecer con $transaction más adelante si hace falta.

export class BookingError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "BookingError";
    this.status = status;
  }
}

export type BookingCandidate = {
  startsAt: Date;
  durationMinutes: number;
};

export async function assertBookable(
  candidate: BookingCandidate,
  excludeId?: string
): Promise<void> {
  const { startsAt, durationMinutes } = candidate;
  const schedule = await getClinicSchedule();

  if (durationMinutes < 5) {
    throw new BookingError("Duração inválida.", 422);
  }

  // Horario de la clínica en hora de Fortaleza (no del proceso).
  const wall = utcToWallClock(startsAt);
  if (wall.weekday === 0) {
    throw new BookingError("A clínica não atende aos domingos.", 422);
  }
  const startMin = wall.hour * 60 + wall.minute;
  if (
    startMin < schedule.opensAtMinutes ||
    startMin + durationMinutes > schedule.closesAtMinutes
  ) {
    throw new BookingError(
      `Horário fora do expediente (${formatClockMinutes(schedule.opensAtMinutes)}–${formatClockMinutes(schedule.closesAtMinutes)}).`,
      422
    );
  }

  // Solape contra citas y bloqueos del mismo día (de Fortaleza).
  const from = wallClockToUtc(wall.y, wall.m, wall.d, 0, 0);
  const to = wallClockToUtc(wall.y, wall.m, wall.d, 23, 59);
  const [appts, blocks] = await Promise.all([
    listAppointments(from, to),
    listTimeBlocks(from, to),
  ]);

  const collision = findCollision({ startsAt, durationMinutes }, appts, blocks, excludeId);
  if (collision) {
    const label =
      collision.kind === "appointment" ? collision.label : `bloqueio: ${collision.label}`;
    throw new BookingError(`Horário ocupado (${label}).`, 409);
  }
}
