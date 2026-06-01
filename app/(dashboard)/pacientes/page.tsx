import Link from "next/link";
import { requirePermission } from "@/lib/auth/guards";
import { listPatients } from "@/lib/modules/patients/service";
import { createPatientAction } from "./actions";
import { PatientForm } from "./patient-form";

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePermission("patients", "read");
  const { q } = await searchParams;
  const patients = await listPatients(q);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pacientes</h1>
        <p className="text-sm text-zinc-500">Cadastro e histórico de pacientes.</p>
      </div>
      <form className="flex gap-2">
        <input name="q" defaultValue={q ?? ""} placeholder="Buscar paciente" className="w-80 rounded-md border p-2" />
        <button className="rounded-md border px-4">Buscar</button>
      </form>
      <PatientForm action={createPatientAction} />
      <div className="rounded-lg border bg-white">
        {patients.map((patient) => (
          <Link key={patient.id} href={`/pacientes/${patient.id}`} className="block border-b p-4 hover:bg-zinc-50">
            <p className="font-medium">{patient.name}</p>
            <p className="text-sm text-zinc-500">{patient.phone}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
