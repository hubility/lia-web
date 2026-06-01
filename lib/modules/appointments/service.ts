import type { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type AppointmentInput = {
  patientId: string;
  catalogItemId?: string | null;
  title: string;
  startsAt: Date;
  durationMinutes: number;
  status: AppointmentStatus;
  notes?: string | null;
};

export async function listAppointments(from?: Date, to?: Date, patientId?: string) {
  return prisma.appointment.findMany({
    where: {
      ...(from && to ? { startsAt: { gte: from, lte: to } } : {}),
      ...(patientId ? { patientId } : {}),
    },
    include: { patient: true, catalogItem: true },
    orderBy: { startsAt: "asc" },
  });
}

// Próximas citas de un paciente: futuras y no canceladas, orden ascendente.
// Es lo que el agente necesita para reagendar/cancelar.
export async function listUpcomingAppointments(patientId: string, now: Date = new Date()) {
  return prisma.appointment.findMany({
    where: {
      patientId,
      startsAt: { gt: now },
      status: { not: "cancelled" },
    },
    include: { catalogItem: true },
    orderBy: { startsAt: "asc" },
  });
}

export async function getAppointment(id: string) {
  return prisma.appointment.findUnique({ where: { id } });
}

export async function createAppointment(input: AppointmentInput) {
  return prisma.appointment.create({ data: input });
}

export async function updateAppointment(id: string, input: AppointmentInput) {
  return prisma.appointment.update({ where: { id }, data: input });
}

export async function deleteAppointment(id: string) {
  return prisma.appointment.delete({ where: { id } });
}

export async function setAppointmentStatus(id: string, status: AppointmentStatus) {
  return prisma.appointment.update({ where: { id }, data: { status } });
}

export async function moveAppointment(id: string, startsAt: Date, durationMinutes: number) {
  return prisma.appointment.update({
    where: { id },
    data: { startsAt, durationMinutes },
  });
}
