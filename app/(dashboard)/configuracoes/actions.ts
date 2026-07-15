"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/guards";
import {
  MAX_MINUTES_IN_DAY,
  MIN_SCHEDULE_MINUTES,
  parseClockInput,
} from "@/lib/agenda/schedule";
import { updateClinicSchedule } from "@/lib/clinic/profile";

export type ScheduleFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function updateClinicScheduleAction(
  _previous: ScheduleFormState,
  formData: FormData
): Promise<ScheduleFormState> {
  await requirePermission("settings", "update");
  const opensAtMinutes = parseClockInput(formData.get("opensAt"));
  const closesAtMinutes = parseClockInput(formData.get("closesAt"));

  if (opensAtMinutes === null || closesAtMinutes === null) {
    return { status: "error", message: "Informe horários válidos." };
  }
  if (
    opensAtMinutes < 0 ||
    closesAtMinutes > MAX_MINUTES_IN_DAY ||
    closesAtMinutes - opensAtMinutes < MIN_SCHEDULE_MINUTES
  ) {
    return {
      status: "error",
      message: "O encerramento deve ser pelo menos 1 hora após a abertura.",
    };
  }
  if (opensAtMinutes % 15 !== 0 || closesAtMinutes % 15 !== 0) {
    return { status: "error", message: "Use intervalos de 15 minutos." };
  }

  await updateClinicSchedule(opensAtMinutes, closesAtMinutes);
  revalidatePath("/agenda");
  revalidatePath("/configuracoes");
  return { status: "success", message: "Horário da clínica atualizado." };
}
