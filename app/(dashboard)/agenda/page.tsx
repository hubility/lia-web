import { requirePermission } from "@/lib/auth/guards";
import { listAppointments } from "@/lib/modules/appointments/service";
import { listTimeBlocks } from "@/lib/modules/timeblocks/service";
import { listCatalogItems } from "@/lib/modules/catalog/service";
import { listPatients } from "@/lib/modules/patients/service";
import {
  parseAgendaDate,
  parseAgendaView,
  rangeFor,
  startOfWeek,
} from "@/lib/agenda/range";
import { AgendaHeader } from "@/components/agenda/agenda-header";
import { WeekView } from "@/components/agenda/week-view";
import { DayView } from "@/components/agenda/day-view";
import { MonthView } from "@/components/agenda/month-view";
import { getClinicSchedule } from "@/lib/clinic/schedule";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  await requirePermission("appointments", "read");
  const params = await searchParams;
  const view = parseAgendaView(params.view);
  const date = parseAgendaDate(params.date);
  const { from, to } = rangeFor(view, date);

  const [appointments, timeBlocks, patients, catalog, schedule] = await Promise.all([
    listAppointments(from, to),
    listTimeBlocks(from, to),
    listPatients(),
    listCatalogItems(false),
    getClinicSchedule(),
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <AgendaHeader view={view} date={date} patients={patients} catalog={catalog} />

      <div className="min-h-0 flex-1">
        {view === "week" && (
          <WeekView
            weekStart={startOfWeek(date)}
            appointments={appointments}
            timeBlocks={timeBlocks}
            patients={patients}
            catalog={catalog}
            schedule={schedule}
          />
        )}
        {view === "day" && (
          <DayView
            date={date}
            appointments={appointments}
            timeBlocks={timeBlocks}
            patients={patients}
            catalog={catalog}
            schedule={schedule}
          />
        )}
        {view === "month" && <MonthView date={date} appointments={appointments} />}
      </div>
    </div>
  );
}
