import type { Appointment, TimeBlock } from "@prisma/client";
import { findCollision } from "@/lib/agenda/collision";
import {
  DEFAULT_CLINIC_SCHEDULE,
  type ClinicSchedule,
} from "@/lib/agenda/schedule";
import { utcToWallClock, wallClockToUtc } from "@/lib/clinic-tz";

// Motor de disponibilidad: la inversa de `findCollision`. En vez de "¿este hueco
// choca?", responde "¿qué huecos NO chocan?". Función pura: sin BD, sin red.
//
// El espaciado entre candidatos es la propia duración del servicio (limpieza
// 60min → candidatos cada 60; evaluación 30min → cada 30). Razona en hora de
// pared de Fortaleza para no depender de la zona del proceso.

type AppointmentLike = Pick<
  Appointment,
  "id" | "startsAt" | "durationMinutes" | "title" | "status"
>;
type TimeBlockLike = Pick<TimeBlock, "id" | "startsAt" | "endsAt" | "kind" | "label">;

export type FindFreeSlotsInput = {
  from: Date; // inicio de la ventana (instante)
  to: Date; // fin de la ventana (instante)
  durationMinutes: number;
  appointments: AppointmentLike[];
  timeBlocks: TimeBlockLike[];
  schedule?: ClinicSchedule;
};

export function findFreeSlots(input: FindFreeSlotsInput): Date[] {
  const {
    from,
    to,
    durationMinutes,
    appointments,
    timeBlocks,
    schedule = DEFAULT_CLINIC_SCHEDULE,
  } = input;
  if (durationMinutes <= 0 || from.getTime() > to.getTime()) return [];

  const slots: Date[] = [];

  // Recorremos día a día en el calendario de Fortaleza. Anclamos el cursor al
  // mediodía UTC para evitar bordes de día al derivar la fecha de pared.
  const fromWall = utcToWallClock(from);
  const toWall = utcToWallClock(to);
  let cursor = Date.UTC(fromWall.y, fromWall.m - 1, fromWall.d, 12);
  const lastDay = Date.UTC(toWall.y, toWall.m - 1, toWall.d, 12);

  while (cursor <= lastDay) {
    const day = utcToWallClock(new Date(cursor));

    // Domingo cerrado.
    if (day.weekday !== 0) {
      for (
        let startMin = schedule.opensAtMinutes;
        startMin + durationMinutes <= schedule.closesAtMinutes;
        startMin += durationMinutes
      ) {
        const startsAt = wallClockToUtc(
          day.y,
          day.m,
          day.d,
          Math.floor(startMin / 60),
          startMin % 60
        );

        // Dentro de la ventana pedida por el agente.
        if (startsAt.getTime() < from.getTime()) continue;
        if (startsAt.getTime() > to.getTime()) continue;

        const collision = findCollision(
          { startsAt, durationMinutes },
          appointments,
          timeBlocks
        );
        if (!collision) slots.push(startsAt);
      }
    }

    cursor += 24 * 60 * 60 * 1000;
  }

  return slots;
}
