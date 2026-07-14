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
import {
  createPrescription,
  updatePrescription,
  deletePrescription,
  type PrescriptionItemInput,
} from "@/lib/modules/prescriptions/service";
import {
  createCertificate,
  updateCertificate,
  deleteCertificate,
} from "@/lib/modules/certificates/service";

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

export type SavePrescriptionInput = {
  prescriptionId?: string;
  patientId: string;
  issueDate: string;
  notes: string | null;
  items: PrescriptionItemInput[];
};

export async function savePrescriptionAction(input: SavePrescriptionInput): Promise<string> {
  await requirePermission("prescriptions", input.prescriptionId ? "update" : "create");
  const data = {
    patientId: input.patientId,
    issueDate: parseDate(input.issueDate),
    notes: input.notes,
    items: input.items,
  };
  const prescription = input.prescriptionId
    ? await updatePrescription(input.prescriptionId, data)
    : await createPrescription(data);
  revalidatePath(`/pacientes/${input.patientId}`);
  return prescription.id;
}

export async function deletePrescriptionAction(prescriptionId: string, patientId: string): Promise<void> {
  await requirePermission("prescriptions", "delete");
  await deletePrescription(prescriptionId);
  revalidatePath(`/pacientes/${patientId}`);
}

export type SaveCertificateInput = {
  certificateId?: string;
  patientId: string;
  issueDate: string;
  absenceStartDate: string;
  absenceEndDate: string;
  cidCodeId: string | null;
  cid: string;
  cidDescription: string | null;
  city: string;
  notes: string | null;
};

export async function saveCertificateAction(input: SaveCertificateInput): Promise<string> {
  await requirePermission("certificates", input.certificateId ? "update" : "create");
  const data = {
    patientId: input.patientId,
    issueDate: parseDate(input.issueDate),
    absenceStartDate: parseDate(input.absenceStartDate),
    absenceEndDate: parseDate(input.absenceEndDate),
    cidCodeId: input.cidCodeId,
    cid: input.cid,
    cidDescription: input.cidDescription,
    city: input.city,
    notes: input.notes,
  };
  const certificate = input.certificateId
    ? await updateCertificate(input.certificateId, data)
    : await createCertificate(data);
  revalidatePath(`/pacientes/${input.patientId}`);
  return certificate.id;
}

export async function deleteCertificateAction(certificateId: string, patientId: string): Promise<void> {
  await requirePermission("certificates", "delete");
  await deleteCertificate(certificateId);
  revalidatePath(`/pacientes/${patientId}`);
}
