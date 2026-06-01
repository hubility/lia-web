"use server";

import { revalidatePath } from "next/cache";
import { parseDate } from "@/lib/dates";
import { requiredText, textValue } from "@/lib/forms";
import { requirePermission } from "@/lib/auth/guards";
import { createCertificate, deleteCertificate } from "@/lib/modules/certificates/service";

export async function createCertificateAction(formData: FormData) {
  await requirePermission("certificates", "create");
  await createCertificate({
    patientId: requiredText(formData, "patientId"),
    issueDate: parseDate(formData.get("issueDate")),
    absenceStartDate: parseDate(formData.get("absenceStartDate")),
    absenceEndDate: parseDate(formData.get("absenceEndDate")),
    cid: requiredText(formData, "cid"),
    city: requiredText(formData, "city"),
    notes: textValue(formData, "notes"),
  });
  revalidatePath("/atestados");
}

export async function deleteCertificateAction(id: string) {
  await requirePermission("certificates", "delete");
  await deleteCertificate(id);
  revalidatePath("/atestados");
}
