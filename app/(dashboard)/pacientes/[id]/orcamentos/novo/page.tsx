import { requirePermission } from "@/lib/auth/guards";
import { getPatientDetail } from "@/lib/modules/patients/service";
import { listCatalogItems } from "@/lib/modules/catalog/service";
import { QuoteEditor } from "@/components/patients/quotes/quote-editor";

export default async function NewQuotePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("quotes", "create");
  const { id } = await params;
  const [patient, catalog] = await Promise.all([getPatientDetail(id), listCatalogItems(false)]);
  return (
    <QuoteEditor
      patient={{ id: patient.id, name: patient.name, phone: patient.phone, cpf: patient.cpf, recordNumber: patient.recordNumber }}
      catalog={catalog}
    />
  );
}
