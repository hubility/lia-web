import { prisma } from "@/lib/db/prisma";

export type QuoteLineInput = {
  catalogItemId?: string | null;
  description: string;
  quantity: number;
  unitPriceCents: number;
};

export type QuoteInput = {
  patientId: string;
  issueDate: Date;
  paymentMethod?: string | null;
  validityDays?: number | null;
  discountCents: number;
  notes?: string | null;
  lines: QuoteLineInput[];
};

async function nextQuoteNumber() {
  const count = await prisma.quote.count();
  return `ORC-${String(count + 1).padStart(5, "0")}`;
}

function lineData(lines: QuoteLineInput[]) {
  return lines.map((line) => ({
    ...line,
    totalPriceCents: line.quantity * line.unitPriceCents,
  }));
}

export async function listQuotes() {
  return prisma.quote.findMany({ include: { patient: true, lines: true }, orderBy: { issueDate: "desc" } });
}

export async function getQuote(id: string) {
  return prisma.quote.findUniqueOrThrow({
    where: { id },
    include: { patient: true, lines: true },
  });
}

export async function createQuote(input: QuoteInput) {
  if (!input.lines.length) throw new Error("Orçamento requer ao menos um item.");
  return prisma.quote.create({
    data: {
      patientId: input.patientId,
      number: await nextQuoteNumber(),
      issueDate: input.issueDate,
      paymentMethod: input.paymentMethod,
      validityDays: input.validityDays,
      discountCents: input.discountCents,
      notes: input.notes,
      lines: { create: lineData(input.lines) },
    },
  });
}

export async function updateQuote(id: string, input: QuoteInput) {
  if (!input.lines.length) throw new Error("Orçamento requer ao menos um item.");
  return prisma.quote.update({
    where: { id },
    data: {
      issueDate: input.issueDate,
      paymentMethod: input.paymentMethod,
      validityDays: input.validityDays,
      discountCents: input.discountCents,
      notes: input.notes,
      lines: { deleteMany: {}, create: lineData(input.lines) },
    },
  });
}

export async function deleteQuote(id: string) {
  return prisma.quote.delete({ where: { id } });
}
