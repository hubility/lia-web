import { prisma } from "@/lib/db/prisma";

export type CatalogInput = {
  name: string;
  description?: string | null;
  priceCents: number;
  durationMinutes: number;
};

export async function listCatalogItems(includeInactive = true) {
  return prisma.catalogItem.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createCatalogItem(input: CatalogInput) {
  return prisma.catalogItem.create({ data: input });
}

export async function updateCatalogItem(id: string, input: CatalogInput) {
  return prisma.catalogItem.update({ where: { id }, data: input });
}

export async function setCatalogItemActive(id: string, isActive: boolean) {
  return prisma.catalogItem.update({ where: { id }, data: { isActive } });
}

export async function deleteCatalogItem(id: string) {
  return prisma.catalogItem.delete({ where: { id } });
}
