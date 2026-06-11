"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/guards";
import {
  addToothTreatment,
  markToothTreatmentDone,
  removeToothTreatment,
  generateQuoteFromPlanned,
} from "@/lib/modules/tooth-treatments/service";

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
