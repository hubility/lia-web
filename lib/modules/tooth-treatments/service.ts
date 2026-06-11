import { prisma } from "@/lib/db/prisma";
import { createQuote } from "@/lib/modules/quotes/service";
import { buildQuoteLines } from "@/lib/patients/odontogram";

export function listToothTreatments(patientId: string) {
  return prisma.toothTreatment.findMany({
    where: { patientId },
    orderBy: { createdAt: "asc" },
  });
}

export async function addToothTreatment(input: {
  patientId: string;
  toothFdi: string;
  catalogItemId: string;
}) {
  const item = await prisma.catalogItem.findUniqueOrThrow({ where: { id: input.catalogItemId } });
  return prisma.toothTreatment.create({
    data: {
      patientId: input.patientId,
      toothFdi: input.toothFdi,
      catalogItemId: item.id,
      description: item.name,
      priceCents: item.priceCents,
      status: "planned",
    },
  });
}

export function markToothTreatmentDone(id: string) {
  return prisma.toothTreatment.update({
    where: { id },
    data: { status: "done", completedAt: new Date() },
  });
}

export function removeToothTreatment(id: string) {
  return prisma.toothTreatment.delete({ where: { id } });
}

/** Toma los planejados pendientes (sin orçamento) y genera un Quote, enlazándolos. */
export async function generateQuoteFromPlanned(patientId: string) {
  const planned = await prisma.toothTreatment.findMany({
    where: { patientId, status: "planned", quoteId: null },
    orderBy: { createdAt: "asc" },
  });
  if (planned.length === 0) throw new Error("Não há tratamentos planejados pendentes.");

  const quote = await createQuote({
    patientId,
    issueDate: new Date(),
    discountCents: 0,
    lines: buildQuoteLines(planned),
  });

  await prisma.toothTreatment.updateMany({
    where: { id: { in: planned.map((p) => p.id) } },
    data: { quoteId: quote.id },
  });

  return quote;
}
