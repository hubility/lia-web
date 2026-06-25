import { prisma } from "@/lib/db/prisma";
import { utcToWallClock, wallClockToUtc } from "@/lib/clinic-tz";
import { listUpcomingAppointments } from "@/lib/modules/appointments/service";

export type PatientInput = {
  name: string;
  phone: string;
  email?: string | null;
  cpf?: string | null;
  birthDate?: Date | null;
  recordNumber?: string | null;
  notes?: string | null;
};

export async function listPatients(query?: string | null) {
  const q = query?.trim();
  return prisma.patient.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { cpf: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
  });
}

export async function getPatientDetail(id: string) {
  return prisma.patient.findUniqueOrThrow({
    where: { id },
    include: {
      appointments: { orderBy: { startsAt: "desc" } },
      quotes: { orderBy: { issueDate: "desc" }, include: { lines: true } },
      prescriptions: { orderBy: { issueDate: "desc" }, include: { items: { orderBy: { position: "asc" } } } },
      certificates: { orderBy: { issueDate: "desc" } },
      toothTreatments: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function createPatient(input: PatientInput) {
  if (!input.name || !input.phone) throw new Error("Nome e telefone são obrigatórios.");
  return prisma.patient.create({ data: input });
}

export async function updatePatient(id: string, input: PatientInput) {
  if (!input.name || !input.phone) throw new Error("Nome e telefone são obrigatórios.");
  return prisma.patient.update({ where: { id }, data: input });
}

export async function deletePatient(id: string) {
  return prisma.patient.delete({ where: { id } });
}

// El agente solo conoce el teléfono. Match EXACTO (no el `contains` difuso de
// `listPatients`, que es para la búsqueda de la web).
export async function findPatientByPhone(phone: string) {
  return prisma.patient.findFirst({ where: { phone: phone.trim() } });
}

// Contexto del paciente para el agente, resuelto por teléfono: próximas
// consultas, último orçamento, última receita y atestados vigentes hoy.
export async function getPatientContextByPhone(phone: string) {
  const patient = await findPatientByPhone(phone);
  if (!patient) return { isPatient: false as const };

  const now = new Date();
  // "Hoy" en hora de Fortaleza, para decidir qué atestados están vigentes con
  // semántica de día completo independientemente de la zona del proceso.
  const today = utcToWallClock(now);
  const startOfToday = wallClockToUtc(today.y, today.m, today.d, 0, 0);
  const endOfToday = wallClockToUtc(today.y, today.m, today.d, 23, 59);

  const [upcomingAppointments, lastQuote, lastPrescription, activeCertificates] =
    await Promise.all([
      listUpcomingAppointments(patient.id, now),
      prisma.quote.findFirst({
        where: { patientId: patient.id },
        orderBy: { issueDate: "desc" },
      }),
      prisma.prescription.findFirst({
        where: { patientId: patient.id },
        orderBy: { issueDate: "desc" },
      }),
      prisma.medicalCertificate.findMany({
        where: {
          patientId: patient.id,
          absenceStartDate: { lte: endOfToday },
          absenceEndDate: { gte: startOfToday },
        },
        orderBy: { issueDate: "desc" },
      }),
    ]);

  return {
    isPatient: true as const,
    patient: { id: patient.id, name: patient.name, phone: patient.phone },
    upcomingAppointments,
    lastQuote,
    lastPrescription,
    activeCertificates,
  };
}

// Lista para el directorio master-detail: pacientes + su próxima consulta
// (futura y no cancelada). Separada de `listPatients` para no inflar el
// payload que consume la agenda.
export async function listPatientDirectory() {
  const now = new Date();
  return prisma.patient.findMany({
    orderBy: { name: "asc" },
    include: {
      appointments: {
        where: { startsAt: { gt: now }, status: { not: "cancelled" } },
        orderBy: { startsAt: "asc" },
        take: 1,
      },
    },
  });
}

export type PatientDirectoryEntry = Awaited<ReturnType<typeof listPatientDirectory>>[number];
export type PatientDetailData = Awaited<ReturnType<typeof getPatientDetail>>;
