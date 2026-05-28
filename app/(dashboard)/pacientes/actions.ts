"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseDate } from "@/lib/dates";
import { requiredText, textValue } from "@/lib/forms";
import { requirePermission } from "@/lib/auth/guards";
import { createPatient, deletePatient, updatePatient } from "@/lib/modules/patients/service";

function patientInput(formData: FormData) {
  return {
    name: requiredText(formData, "name"),
    phone: requiredText(formData, "phone"),
    email: textValue(formData, "email"),
    cpf: textValue(formData, "cpf"),
    birthDate: textValue(formData, "birthDate") ? parseDate(formData.get("birthDate")) : null,
    recordNumber: textValue(formData, "recordNumber"),
    notes: textValue(formData, "notes"),
  };
}

export async function createPatientAction(formData: FormData) {
  await requirePermission("patients", "create");
  const patient = await createPatient(patientInput(formData));
  revalidatePath("/pacientes");
  redirect(`/pacientes/${patient.id}`);
}

export async function updatePatientAction(id: string, formData: FormData) {
  await requirePermission("patients", "update");
  await updatePatient(id, patientInput(formData));
  revalidatePath("/pacientes");
  redirect(`/pacientes/${id}`);
}

export async function deletePatientAction(id: string) {
  await requirePermission("patients", "delete");
  await deletePatient(id);
  revalidatePath("/pacientes");
  redirect("/pacientes");
}
