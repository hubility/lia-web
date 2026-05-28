import type { AppointmentStatus } from "@/app/generated/prisma/client";
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

export async function listAppointments(from?: Date, to?: Date) {
  return prisma.appointment.findMany({
    where: from && to ? { startsAt: { gte: from, lte: to } } : undefined,
    include: { patient: true, catalogItem: true },
    orderBy: { startsAt: "asc" },
  });
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
