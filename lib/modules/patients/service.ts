import { prisma } from "@/lib/db/prisma";

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
      quotes: { orderBy: { issueDate: "desc" } },
      prescriptions: { orderBy: { issueDate: "desc" } },
      certificates: { orderBy: { issueDate: "desc" } },
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
