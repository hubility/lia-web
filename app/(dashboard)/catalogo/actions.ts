"use server";

import { revalidatePath } from "next/cache";
import { parseCents } from "@/lib/money";
import { intValue, requiredText, textValue } from "@/lib/forms";
import { requirePermission } from "@/lib/auth/guards";
import { createCatalogItem, deleteCatalogItem, setCatalogItemActive, updateCatalogItem } from "@/lib/modules/catalog/service";

function catalogInput(formData: FormData) {
  return {
    name: requiredText(formData, "name"),
    description: textValue(formData, "description"),
    priceCents: parseCents(formData.get("price")),
    durationMinutes: intValue(formData, "durationMinutes", 30),
  };
}

export async function createCatalogAction(formData: FormData) {
  await requirePermission("catalog", "create");
  await createCatalogItem(catalogInput(formData));
  revalidatePath("/catalogo");
}

export async function updateCatalogAction(id: string, formData: FormData) {
  await requirePermission("catalog", "update");
  await updateCatalogItem(id, catalogInput(formData));
  revalidatePath("/catalogo");
}

export async function toggleCatalogAction(id: string, isActive: boolean) {
  await requirePermission("catalog", "update");
  await setCatalogItemActive(id, isActive);
  revalidatePath("/catalogo");
}

export async function deleteCatalogAction(id: string) {
  await requirePermission("catalog", "delete");
  await deleteCatalogItem(id);
  revalidatePath("/catalogo");
}
