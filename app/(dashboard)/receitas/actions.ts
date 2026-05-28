"use server";

import { revalidatePath } from "next/cache";
import { parseDate } from "@/lib/dates";
import { requiredText, textValue } from "@/lib/forms";
import { requirePermission } from "@/lib/auth/guards";
import { createPrescription, deletePrescription } from "@/lib/modules/prescriptions/service";

export async function createPrescriptionAction(formData: FormData) {
  await requirePermission("prescriptions", "create");
  await createPrescription({
    patientId: requiredText(formData, "patientId"),
    issueDate: parseDate(formData.get("issueDate")),
    notes: textValue(formData, "notes"),
    items: [{
      medicine: requiredText(formData, "medicine"),
      instructions: requiredText(formData, "instructions"),
      position: 1,
    }],
  });
  revalidatePath("/receitas");
}

export async function deletePrescriptionAction(id: string) {
  await requirePermission("prescriptions", "delete");
  await deletePrescription(id);
  revalidatePath("/receitas");
}
