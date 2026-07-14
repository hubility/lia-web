"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { parseCents } from "@/lib/money";
import { intValue, requiredText, textValue } from "@/lib/forms";
import { requirePermission } from "@/lib/auth/guards";
import { createCatalogItem, deleteCatalogItem, setCatalogItemActive, updateCatalogItem } from "@/lib/modules/catalog/service";
import { createMedication, deleteMedication, setMedicationActive, updateMedication } from "@/lib/modules/medications/service";
import { createCidCode, deleteCidCode, setCidCodeActive, updateCidCode } from "@/lib/modules/cid/service";

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

function medicationInput(formData: FormData) {
  return {
    name: requiredText(formData, "name"),
    defaultPosology: requiredText(formData, "defaultPosology"),
  };
}

export async function createMedicationAction(formData: FormData) {
  await requirePermission("catalog", "create");
  await createMedication(medicationInput(formData));
  revalidatePath("/catalogo");
}

export async function updateMedicationAction(id: string, formData: FormData) {
  await requirePermission("catalog", "update");
  await updateMedication(id, medicationInput(formData));
  revalidatePath("/catalogo");
}

export async function toggleMedicationAction(id: string, isActive: boolean) {
  await requirePermission("catalog", "update");
  await setMedicationActive(id, isActive);
  revalidatePath("/catalogo");
}

export async function deleteMedicationAction(id: string) {
  await requirePermission("catalog", "delete");
  await deleteMedication(id);
  revalidatePath("/catalogo");
}

function cidInput(formData: FormData) {
  return {
    code: requiredText(formData, "code").toUpperCase(),
    description: requiredText(formData, "description"),
  };
}

/** `CidCode.code` es @unique: sin esto el doctor vería el error crudo de Prisma. */
async function withUniqueCode<T>(run: () => Promise<T>) {
  try {
    return await run();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Já existe um CID com esse código.");
    }
    throw error;
  }
}

export async function createCidAction(formData: FormData) {
  await requirePermission("catalog", "create");
  await withUniqueCode(() => createCidCode(cidInput(formData)));
  revalidatePath("/catalogo");
}

export async function updateCidAction(id: string, formData: FormData) {
  await requirePermission("catalog", "update");
  await withUniqueCode(() => updateCidCode(id, cidInput(formData)));
  revalidatePath("/catalogo");
}

export async function toggleCidAction(id: string, isActive: boolean) {
  await requirePermission("catalog", "update");
  await setCidCodeActive(id, isActive);
  revalidatePath("/catalogo");
}

export async function deleteCidAction(id: string) {
  await requirePermission("catalog", "delete");
  await deleteCidCode(id);
  revalidatePath("/catalogo");
}
