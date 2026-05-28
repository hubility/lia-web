"use server";

import type { AppointmentStatus } from "@/app/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { intValue, requiredText, textValue } from "@/lib/forms";
import { parseDateTime } from "@/lib/dates";
import { requirePermission } from "@/lib/auth/guards";
import { createAppointment, deleteAppointment, setAppointmentStatus, updateAppointment } from "@/lib/modules/appointments/service";

function appointmentInput(formData: FormData) {
  return {
    patientId: requiredText(formData, "patientId"),
    catalogItemId: textValue(formData, "catalogItemId"),
    title: requiredText(formData, "title"),
    startsAt: parseDateTime(formData.get("startsAt")),
    durationMinutes: intValue(formData, "durationMinutes", 30),
    status: requiredText(formData, "status") as AppointmentStatus,
    notes: textValue(formData, "notes"),
  };
}

export async function createAppointmentAction(formData: FormData) {
  await requirePermission("appointments", "create");
  await createAppointment(appointmentInput(formData));
  revalidatePath("/agenda");
}

export async function updateAppointmentAction(id: string, formData: FormData) {
  await requirePermission("appointments", "update");
  await updateAppointment(id, appointmentInput(formData));
  revalidatePath("/agenda");
}

export async function setAppointmentStatusAction(id: string, status: AppointmentStatus) {
  await requirePermission("appointments", "update");
  await setAppointmentStatus(id, status);
  revalidatePath("/agenda");
}

export async function deleteAppointmentAction(id: string) {
  await requirePermission("appointments", "delete");
  await deleteAppointment(id);
  revalidatePath("/agenda");
}
