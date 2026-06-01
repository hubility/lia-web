"use server";

import { revalidatePath } from "next/cache";
import { parseDate } from "@/lib/dates";
import { intValue, requiredText, textValue } from "@/lib/forms";
import { parseCents } from "@/lib/money";
import { requirePermission } from "@/lib/auth/guards";
import { createQuote, deleteQuote } from "@/lib/modules/quotes/service";

export async function createQuoteAction(formData: FormData) {
  await requirePermission("quotes", "create");
  await createQuote({
    patientId: requiredText(formData, "patientId"),
    issueDate: parseDate(formData.get("issueDate")),
    paymentMethod: textValue(formData, "paymentMethod"),
    validityDays: intValue(formData, "validityDays", 30),
    discountCents: parseCents(formData.get("discount")),
    notes: textValue(formData, "notes"),
    lines: [{
      description: requiredText(formData, "description"),
      quantity: intValue(formData, "quantity", 1),
      unitPriceCents: parseCents(formData.get("unitPrice")),
    }],
  });
  revalidatePath("/orcamentos");
}

export async function deleteQuoteAction(id: string) {
  await requirePermission("quotes", "delete");
  await deleteQuote(id);
  revalidatePath("/orcamentos");
}
