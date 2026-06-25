"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/guards";
import { parseDate } from "@/lib/dates";
import {
  addToothTreatment,
  markToothTreatmentDone,
  removeToothTreatment,
  generateQuoteFromPlanned,
} from "@/lib/modules/tooth-treatments/service";
import {
  createQuote,
  updateQuote,
  deleteQuote,
  type QuoteLineInput,
} from "@/lib/modules/quotes/service";

export async function addToothTreatmentAction(input: {
  patientId: string;
  toothFdi: string;
  catalogItemId: string;
}): Promise<void> {
  await requirePermission("patients", "update");
  await addToothTreatment(input);
  revalidatePath(`/pacientes/${input.patientId}`);
}

export async function markToothTreatmentDoneAction(id: string, patientId: string): Promise<void> {
  await requirePermission("patients", "update");
  await markToothTreatmentDone(id);
  revalidatePath(`/pacientes/${patientId}`);
}

export async function removeToothTreatmentAction(id: string, patientId: string): Promise<void> {
  await requirePermission("patients", "update");
  await removeToothTreatment(id);
  revalidatePath(`/pacientes/${patientId}`);
}

export async function generateQuoteFromPlannedAction(patientId: string): Promise<void> {
  await requirePermission("patients", "update");
  await generateQuoteFromPlanned(patientId);
  revalidatePath(`/pacientes/${patientId}`);
}

export type SaveQuoteInput = {
  quoteId?: string;
  patientId: string;
  issueDate: string;
  paymentMethod: string | null;
  validityDays: number | null;
  discountCents: number;
  notes: string | null;
  lines: QuoteLineInput[];
};

export async function saveQuoteAction(input: SaveQuoteInput): Promise<string> {
  await requirePermission("quotes", input.quoteId ? "update" : "create");
  const data = {
    patientId: input.patientId,
    issueDate: parseDate(input.issueDate),
    paymentMethod: input.paymentMethod,
    validityDays: input.validityDays,
    discountCents: input.discountCents,
    notes: input.notes,
    lines: input.lines,
  };
  const quote = input.quoteId
    ? await updateQuote(input.quoteId, data)
    : await createQuote(data);
  revalidatePath(`/pacientes/${input.patientId}`);
  return quote.id;
}

export async function deleteQuoteAction(quoteId: string, patientId: string): Promise<void> {
  await requirePermission("quotes", "delete");
  await deleteQuote(quoteId);
  revalidatePath(`/pacientes/${patientId}`);
}
