import { requirePermission } from "@/lib/auth/guards";
import { getClinicSchedule } from "@/lib/clinic/schedule";
import { ScheduleForm } from "./schedule-form";

export default async function SettingsPage() {
  await requirePermission("settings", "read");
  const schedule = await getClinicSchedule();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Configurações</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
          Preferências operacionais compartilhadas pela clínica.
        </p>
      </header>
      <ScheduleForm {...schedule} />
    </div>
  );
}
