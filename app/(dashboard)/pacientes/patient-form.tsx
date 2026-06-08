import type { Patient } from "@prisma/client";

const fieldClass =
  "rounded-md border bg-card p-2 text-sm outline-none focus:ring-2 focus:ring-ring";

export function PatientForm({
  patient,
  action,
}: {
  patient?: Patient;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="grid gap-3 rounded-lg border bg-card p-5 md:grid-cols-2">
      <input name="name" defaultValue={patient?.name} placeholder="Nome" required className={fieldClass} />
      <input name="phone" defaultValue={patient?.phone} placeholder="Telefone" required className={fieldClass} />
      <input name="email" defaultValue={patient?.email ?? ""} placeholder="Email" className={fieldClass} />
      <input name="cpf" defaultValue={patient?.cpf ?? ""} placeholder="CPF" className={fieldClass} />
      <input name="birthDate" type="date" defaultValue={patient?.birthDate?.toISOString().slice(0, 10) ?? ""} className={fieldClass} />
      <input name="recordNumber" defaultValue={patient?.recordNumber ?? ""} placeholder="Prontuário" className={fieldClass} />
      <textarea name="notes" defaultValue={patient?.notes ?? ""} placeholder="Observações" className={`${fieldClass} md:col-span-2`} />
      <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 md:col-span-2">
        Salvar paciente
      </button>
    </form>
  );
}
