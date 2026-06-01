"use server";

import type { AppointmentStatus, TimeBlockKind } from "@/app/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { intValue, requiredText, textValue } from "@/lib/forms";
import { parseDateTime } from "@/lib/dates";
import { requirePermission } from "@/lib/auth/guards";
import {
  createAppointment,
  deleteAppointment,
  listAppointments,
  moveAppointment,
  setAppointmentStatus,
  updateAppointment,
} from "@/lib/modules/appointments/service";
import {
  createTimeBlock,
  deleteTimeBlock,
  getTimeBlock,
  listTimeBlocks,
  moveTimeBlock,
} from "@/lib/modules/timeblocks/service";
import { findCollision } from "@/lib/agenda/collision";
import { endOfDay, startOfDay } from "@/lib/agenda/range";

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

export async function createTimeBlockAction(formData: FormData) {
  await requirePermission("appointments", "create");
  await createTimeBlock({
    label: requiredText(formData, "label"),
    kind: requiredText(formData, "kind") as TimeBlockKind,
    startsAt: parseDateTime(formData.get("startsAt")),
    endsAt: parseDateTime(formData.get("endsAt")),
    notes: textValue(formData, "notes"),
  });
  revalidatePath("/agenda");
}

export async function deleteTimeBlockAction(id: string) {
  await requirePermission("appointments", "delete");
  await deleteTimeBlock(id);
  revalidatePath("/agenda");
}

export type MoveResult = { ok: true } | { ok: false; error: string };

export async function moveAppointmentAction(
  id: string,
  startsAtIso: string,
  durationMinutes: number
): Promise<MoveResult> {
  await requirePermission("appointments", "update");
  const startsAt = new Date(startsAtIso);
  if (Number.isNaN(startsAt.getTime())) return { ok: false, error: "Data inválida" };
  if (durationMinutes < 5) return { ok: false, error: "Duração muito curta" };

  const from = startOfDay(startsAt);
  const to = endOfDay(startsAt);
  const [appts, blocks] = await Promise.all([listAppointments(from, to), listTimeBlocks(from, to)]);

  const collision = findCollision({ startsAt, durationMinutes }, appts, blocks, id);
  if (collision) {
    const label = collision.kind === "appointment" ? collision.label : `bloqueio: ${collision.label}`;
    return { ok: false, error: `Choca com ${label}` };
  }

  await moveAppointment(id, startsAt, durationMinutes);
  revalidatePath("/agenda");
  return { ok: true };
}

export async function moveTimeBlockAction(
  id: string,
  startsAtIso: string,
  endsAtIso: string
): Promise<MoveResult> {
  await requirePermission("appointments", "update");
  const block = await getTimeBlock(id);
  if (!block) return { ok: false, error: "Bloqueio não encontrado" };
  if (block.kind === "lunch") return { ok: false, error: "Horário de almoço é configuração do sistema" };

  const startsAt = new Date(startsAtIso);
  const endsAt = new Date(endsAtIso);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return { ok: false, error: "Data inválida" };
  }
  const durationMinutes = Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000);
  if (durationMinutes < 5) return { ok: false, error: "Duração muito curta" };

  const from = startOfDay(startsAt);
  const to = endOfDay(startsAt);
  const [appts, blocks] = await Promise.all([listAppointments(from, to), listTimeBlocks(from, to)]);

  const collision = findCollision({ startsAt, durationMinutes }, appts, blocks, id);
  if (collision) {
    const label = collision.kind === "appointment" ? collision.label : `bloqueio: ${collision.label}`;
    return { ok: false, error: `Choca com ${label}` };
  }

  await moveTimeBlock(id, startsAt, endsAt);
  revalidatePath("/agenda");
  return { ok: true };
}
