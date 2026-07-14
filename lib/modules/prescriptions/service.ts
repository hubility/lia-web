import { prisma } from "@/lib/db/prisma";

export type PrescriptionItemInput = {
  medicationId?: string | null;
  medicine: string;
  instructions: string;
  position: number;
};

export type PrescriptionInput = {
  patientId: string;
  issueDate: Date;
  notes?: string | null;
  items: PrescriptionItemInput[];
};

export async function listPrescriptions() {
  return prisma.prescription.findMany({ include: { patient: true }, orderBy: { issueDate: "desc" } });
}

export async function getPrescription(id: string) {
  return prisma.prescription.findUniqueOrThrow({
    where: { id },
    include: { patient: true, items: { orderBy: { position: "asc" } } },
  });
}

export async function createPrescription(input: PrescriptionInput) {
  if (!input.items.length) throw new Error("Receita requer ao menos um item.");
  return prisma.prescription.create({
    data: {
      patientId: input.patientId,
      issueDate: input.issueDate,
      notes: input.notes,
      items: { create: input.items },
    },
  });
}

export async function updatePrescription(id: string, input: PrescriptionInput) {
  if (!input.items.length) throw new Error("Receita requer ao menos um item.");
  return prisma.prescription.update({
    where: { id },
    data: {
      issueDate: input.issueDate,
      notes: input.notes,
      items: { deleteMany: {}, create: input.items },
    },
  });
}

export async function deletePrescription(id: string) {
  return prisma.prescription.delete({ where: { id } });
}
