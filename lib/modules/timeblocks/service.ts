import type { TimeBlockKind } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

export type TimeBlockInput = {
  label: string;
  kind: TimeBlockKind;
  startsAt: Date;
  endsAt: Date;
  notes?: string | null;
};

export async function listTimeBlocks(from?: Date, to?: Date) {
  return prisma.timeBlock.findMany({
    where: from && to ? { startsAt: { gte: from, lte: to } } : undefined,
    orderBy: { startsAt: "asc" },
  });
}

export async function createTimeBlock(input: TimeBlockInput) {
  return prisma.timeBlock.create({ data: input });
}

export async function deleteTimeBlock(id: string) {
  return prisma.timeBlock.delete({ where: { id } });
}

export async function moveTimeBlock(id: string, startsAt: Date, endsAt: Date) {
  return prisma.timeBlock.update({
    where: { id },
    data: { startsAt, endsAt },
  });
}

export async function getTimeBlock(id: string) {
  return prisma.timeBlock.findUnique({ where: { id } });
}
