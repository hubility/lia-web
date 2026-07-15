import { normalizeClinicSchedule, type ClinicSchedule } from "@/lib/agenda/schedule";
import { getClinicProfile } from "@/lib/clinic/profile";

export async function getClinicSchedule(): Promise<ClinicSchedule> {
  return normalizeClinicSchedule(await getClinicProfile());
}
