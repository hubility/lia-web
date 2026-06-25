import { requirePermission } from "@/lib/auth/guards";
import { getPatientDetail } from "@/lib/modules/patients/service";
import { listCatalogItems } from "@/lib/modules/catalog/service";
import { getQuote } from "@/lib/modules/quotes/service";
import { QuoteEditor } from "@/components/patients/quotes/quote-editor";

export default async function EditQuotePage({ params }: { params: Promise<{ id: string; quoteId: string }> }) {
  await requirePermission("quotes", "update");
  const { id, quoteId } = await params;
  const [patient, catalog, quote] = await Promise.all([
    getPatientDetail(id),
    listCatalogItems(false),
    getQuote(quoteId),
  ]);
  return (
    <QuoteEditor
      patient={{ id: patient.id, name: patient.name, phone: patient.phone, cpf: patient.cpf, recordNumber: patient.recordNumber }}
      catalog={catalog}
      quote={{
        id: quote.id,
        number: quote.number,
        issueDate: quote.issueDate,
        paymentMethod: quote.paymentMethod,
        validityDays: quote.validityDays,
        discountCents: quote.discountCents,
        notes: quote.notes,
        lines: quote.lines.map((l) => ({
          catalogItemId: l.catalogItemId,
          description: l.description,
          quantity: l.quantity,
          unitPriceCents: l.unitPriceCents,
        })),
      }}
    />
  );
}
