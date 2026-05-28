import Link from "next/link";
import { requirePermission } from "@/lib/auth/guards";
import { formatDate } from "@/lib/dates";
import { listPatients } from "@/lib/modules/patients/service";
import { listPrescriptions } from "@/lib/modules/prescriptions/service";
import { createPrescriptionAction, deletePrescriptionAction } from "./actions";

export default async function PrescriptionsPage() {
  await requirePermission("prescriptions", "read");
  const [prescriptions, patients] = await Promise.all([listPrescriptions(), listPatients()]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Receitas</h1>
      <form action={createPrescriptionAction} className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-2">
        <select name="patientId" required className="rounded-md border p-2">
          <option value="">Paciente</option>
          {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
        </select>
        <input name="issueDate" type="date" required className="rounded-md border p-2" />
        <input name="medicine" placeholder="Medicamento" required className="rounded-md border p-2" />
        <input name="instructions" placeholder="Instruções" required className="rounded-md border p-2" />
        <textarea name="notes" placeholder="Observações" className="rounded-md border p-2 md:col-span-2" />
        <button className="rounded-md bg-red-700 px-4 py-2 font-semibold text-white md:col-span-2">Criar receita</button>
      </form>
      {prescriptions.map((item) => (
        <article key={item.id} className="rounded-lg border bg-white p-4">
          <p className="font-semibold">{item.patient.name} · {formatDate(item.issueDate)}</p>
          <div className="mt-3 flex gap-2">
            <Link href={`/api/pdf/receitas/${item.id}`} className="rounded-md border px-3 py-1 text-sm">PDF</Link>
            <form action={deletePrescriptionAction.bind(null, item.id)}>
              <button className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700">Excluir</button>
            </form>
          </div>
        </article>
      ))}
    </div>
  );
}
