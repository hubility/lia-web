"use server";

import type { Patient } from "@prisma/client";
import { revalidatePath } from "next/cache";
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

export async function createPatientAction(formData: FormData): Promise<string> {
  await requirePermission("patients", "create");
  const patient = await createPatient(patientInput(formData));
  revalidatePath("/pacientes");
  return patient.id;
}

// Alta mínima (nome + telefone) para creación inline desde el selector da agenda.
// Devuelve o paciente completo para que o combo o adicione à lista e o selecione.
export async function quickCreatePatientAction(input: { name: string; phone: string }): Promise<Patient> {
  await requirePermission("patients", "create");
  const patient = await createPatient({ name: input.name.trim(), phone: input.phone.trim() });
  revalidatePath("/pacientes");
  revalidatePath("/agenda");
  return patient;
}

export async function updatePatientAction(id: string, formData: FormData): Promise<void> {
  await requirePermission("patients", "update");
  await updatePatient(id, patientInput(formData));
  revalidatePath("/pacientes");
}

export async function deletePatientAction(id: string): Promise<void> {
  await requirePermission("patients", "delete");
  await deletePatient(id);
  revalidatePath("/pacientes");
}
