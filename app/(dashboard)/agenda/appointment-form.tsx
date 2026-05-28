import type { CatalogItem, Patient } from "@/app/generated/prisma/client";

export function AppointmentForm({
  patients,
  catalog,
  action,
}: {
  patients: Patient[];
  catalog: CatalogItem[];
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-6">
      <select name="patientId" required className="rounded-md border p-2 md:col-span-2">
        <option value="">Paciente</option>
        {patients.map((patient) => (
          <option key={patient.id} value={patient.id}>{patient.name}</option>
        ))}
      </select>
      <select name="catalogItemId" className="rounded-md border p-2 md:col-span-2">
        <option value="">Procedimento</option>
        {catalog.map((item) => (
          <option key={item.id} value={item.id}>{item.name}</option>
        ))}
      </select>
      <input name="title" placeholder="Título" required className="rounded-md border p-2 md:col-span-2" />
      <input name="startsAt" type="datetime-local" required className="rounded-md border p-2 md:col-span-2" />
      <input name="durationMinutes" type="number" defaultValue={60} required className="rounded-md border p-2" />
      <select name="status" defaultValue="scheduled" className="rounded-md border p-2">
        <option value="scheduled">Agendada</option>
        <option value="confirmed">Confirmada</option>
        <option value="cancelled">Cancelada</option>
        <option value="completed">Concluída</option>
      </select>
      <input name="notes" placeholder="Observações" className="rounded-md border p-2 md:col-span-2" />
      <button className="rounded-md bg-red-700 px-4 py-2 font-semibold text-white md:col-span-6">Salvar consulta</button>
    </form>
  );
}
