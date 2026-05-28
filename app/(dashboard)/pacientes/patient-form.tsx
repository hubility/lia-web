import type { Patient } from "@/app/generated/prisma/client";

export function PatientForm({
  patient,
  action,
}: {
  patient?: Patient;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-5 md:grid-cols-2">
      <input name="name" defaultValue={patient?.name} placeholder="Nome" required className="rounded-md border p-2" />
      <input name="phone" defaultValue={patient?.phone} placeholder="Telefone" required className="rounded-md border p-2" />
      <input name="email" defaultValue={patient?.email ?? ""} placeholder="Email" className="rounded-md border p-2" />
      <input name="cpf" defaultValue={patient?.cpf ?? ""} placeholder="CPF" className="rounded-md border p-2" />
      <input name="birthDate" type="date" defaultValue={patient?.birthDate?.toISOString().slice(0, 10) ?? ""} className="rounded-md border p-2" />
      <input name="recordNumber" defaultValue={patient?.recordNumber ?? ""} placeholder="Prontuário" className="rounded-md border p-2" />
      <textarea name="notes" defaultValue={patient?.notes ?? ""} placeholder="Observações" className="rounded-md border p-2 md:col-span-2" />
      <button className="rounded-md bg-red-700 px-4 py-2 font-semibold text-white md:col-span-2">
        Salvar paciente
      </button>
    </form>
  );
}
