import Link from "next/link";
import { requirePermission } from "@/lib/auth/guards";
import { formatBRL } from "@/lib/money";
import { listPatients } from "@/lib/modules/patients/service";
import { listQuotes } from "@/lib/modules/quotes/service";
import { createQuoteAction, deleteQuoteAction } from "./actions";

export default async function QuotesPage() {
  await requirePermission("quotes", "read");
  const [quotes, patients] = await Promise.all([listQuotes(), listPatients()]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Orçamentos</h1>
      <form action={createQuoteAction} className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-4">
        <select name="patientId" required className="rounded-md border p-2">
          <option value="">Paciente</option>
          {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
        </select>
        <input name="issueDate" type="date" required className="rounded-md border p-2" />
        <input name="description" placeholder="Descrição" required className="rounded-md border p-2" />
        <input name="unitPrice" placeholder="Valor unit." required className="rounded-md border p-2" />
        <input name="quantity" type="number" defaultValue={1} required className="rounded-md border p-2" />
        <input name="discount" placeholder="Desconto" className="rounded-md border p-2" />
        <input name="paymentMethod" placeholder="Forma de pagamento" className="rounded-md border p-2" />
        <input name="validityDays" type="number" defaultValue={30} className="rounded-md border p-2" />
        <textarea name="notes" placeholder="Observações" className="rounded-md border p-2 md:col-span-4" />
        <button className="rounded-md bg-red-700 px-4 py-2 font-semibold text-white md:col-span-4">Criar orçamento</button>
      </form>
      <div className="space-y-3">
        {quotes.map((quote) => {
          const subtotal = quote.lines?.reduce?.((sum, line) => sum + line.totalPriceCents, 0) ?? 0;
          return (
            <article key={quote.id} className="rounded-lg border bg-white p-4">
              <p className="font-semibold">{quote.number} · {quote.patient.name}</p>
              <p className="text-sm text-zinc-500">Total: {formatBRL(subtotal - quote.discountCents)}</p>
              <div className="mt-3 flex gap-2">
                <Link href={`/api/pdf/orcamentos/${quote.id}`} className="rounded-md border px-3 py-1 text-sm">PDF</Link>
                <form action={deleteQuoteAction.bind(null, quote.id)}>
                  <button className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700">Excluir</button>
                </form>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
