import { requirePermission } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/dates";
import { listAppointments } from "@/lib/modules/appointments/service";
import { listCatalogItems } from "@/lib/modules/catalog/service";
import { listPatients } from "@/lib/modules/patients/service";
import { createAppointmentAction, deleteAppointmentAction, setAppointmentStatusAction } from "./actions";
import { AppointmentForm } from "./appointment-form";

export default async function AgendaPage() {
  await requirePermission("appointments", "read");
  const [appointments, patients, catalog] = await Promise.all([
    listAppointments(),
    listPatients(),
    listCatalogItems(false),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Agenda</h1>
        <p className="text-sm text-zinc-500">Gestão de consultas do consultório.</p>
      </div>
      <AppointmentForm patients={patients} catalog={catalog} action={createAppointmentAction} />
      <div className="grid gap-3">
        {appointments.map((appointment) => (
          <article key={appointment.id} className="rounded-lg border bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{formatDateTime(appointment.startsAt)} · {appointment.title}</p>
                <p className="text-sm text-zinc-500">{appointment.patient.name} · {appointment.durationMinutes}min · {appointment.status}</p>
                {appointment.notes && <p className="mt-2 text-sm text-zinc-600">{appointment.notes}</p>}
              </div>
              <form className="flex gap-2">
                <button formAction={setAppointmentStatusAction.bind(null, appointment.id, "confirmed")} className="rounded-md border px-3 py-1 text-sm">Confirmar</button>
                <button formAction={setAppointmentStatusAction.bind(null, appointment.id, "completed")} className="rounded-md border px-3 py-1 text-sm">Concluir</button>
                <button formAction={deleteAppointmentAction.bind(null, appointment.id)} className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700">Excluir</button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
