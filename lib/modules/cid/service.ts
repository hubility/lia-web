import { prisma } from "@/lib/db/prisma";

export type CidInput = {
  code: string;
  description: string;
};

export async function listCidCodes(includeInactive = true) {
  return prisma.cidCode.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { code: "asc" },
  });
}

export async function createCidCode(input: CidInput) {
  return prisma.cidCode.create({ data: input });
}

export async function updateCidCode(id: string, input: CidInput) {
  return prisma.cidCode.update({ where: { id }, data: input });
}

export async function setCidCodeActive(id: string, isActive: boolean) {
  return prisma.cidCode.update({ where: { id }, data: { isActive } });
}

export async function deleteCidCode(id: string) {
  return prisma.cidCode.delete({ where: { id } });
}
