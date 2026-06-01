import { requirePermission } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/dates";
import { getPatientDetail } from "@/lib/modules/patients/service";
import { deletePatientAction, updatePatientAction } from "../actions";
import { PatientForm } from "../patient-form";

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("patients", "read");
  const { id } = await params;
  const patient = await getPatientDetail(id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{patient.name}</h1>
        <p className="text-sm text-zinc-500">{patient.phone}</p>
      </div>
      <PatientForm patient={patient} action={updatePatientAction.bind(null, patient.id)} />
      <form action={deletePatientAction.bind(null, patient.id)}>
        <button className="rounded-md border border-red-300 px-4 py-2 text-red-700">Excluir paciente</button>
      </form>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          <h2 className="font-semibold">Consultas</h2>
          {patient.appointments.map((item) => (
            <p key={item.id} className="text-sm text-zinc-600">{formatDateTime(item.startsAt)} · {item.title}</p>
          ))}
        </div>
        <div className="rounded-lg border bg-white p-4">
          <h2 className="font-semibold">Documentos</h2>
          <p className="text-sm text-zinc-600">Orçamentos: {patient.quotes.length}</p>
          <p className="text-sm text-zinc-600">Receitas: {patient.prescriptions.length}</p>
          <p className="text-sm text-zinc-600">Atestados: {patient.certificates.length}</p>
        </div>
      </section>
    </div>
  );
}
