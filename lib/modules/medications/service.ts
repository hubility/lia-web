import { prisma } from "@/lib/db/prisma";

export type MedicationInput = {
  name: string;
  defaultPosology: string;
};

export async function listMedications(includeInactive = true) {
  return prisma.medication.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createMedication(input: MedicationInput) {
  return prisma.medication.create({ data: input });
}

export async function updateMedication(id: string, input: MedicationInput) {
  return prisma.medication.update({ where: { id }, data: input });
}

export async function setMedicationActive(id: string, isActive: boolean) {
  return prisma.medication.update({ where: { id }, data: { isActive } });
}

export async function deleteMedication(id: string) {
  return prisma.medication.delete({ where: { id } });
}
