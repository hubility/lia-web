import Link from "next/link";
import { requirePermission } from "@/lib/auth/guards";
import { formatDate } from "@/lib/dates";
import { listCertificates } from "@/lib/modules/certificates/service";
import { listPatients } from "@/lib/modules/patients/service";
import { createCertificateAction, deleteCertificateAction } from "./actions";

export default async function CertificatesPage() {
  await requirePermission("certificates", "read");
  const [certificates, patients] = await Promise.all([listCertificates(), listPatients()]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Atestados</h1>
      <form action={createCertificateAction} className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-3">
        <select name="patientId" required className="rounded-md border p-2">
          <option value="">Paciente</option>
          {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
        </select>
        <input name="issueDate" type="date" required className="rounded-md border p-2" />
        <input name="city" defaultValue="Fortaleza" required className="rounded-md border p-2" />
        <input name="absenceStartDate" type="date" required className="rounded-md border p-2" />
        <input name="absenceEndDate" type="date" required className="rounded-md border p-2" />
        <input name="cid" placeholder="CID" required className="rounded-md border p-2" />
        <textarea name="notes" placeholder="Observações" className="rounded-md border p-2 md:col-span-3" />
        <button className="rounded-md bg-red-700 px-4 py-2 font-semibold text-white md:col-span-3">Criar atestado</button>
      </form>
      {certificates.map((item) => (
        <article key={item.id} className="rounded-lg border bg-white p-4">
          <p className="font-semibold">{item.patient.name} · {formatDate(item.issueDate)}</p>
          <p className="text-sm text-zinc-500">{formatDate(item.absenceStartDate)} a {formatDate(item.absenceEndDate)} · {item.cid}</p>
          <div className="mt-3 flex gap-2">
            <Link href={`/api/pdf/atestados/${item.id}`} className="rounded-md border px-3 py-1 text-sm">PDF</Link>
            <form action={deleteCertificateAction.bind(null, item.id)}>
              <button className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700">Excluir</button>
            </form>
          </div>
        </article>
      ))}
    </div>
  );
}
