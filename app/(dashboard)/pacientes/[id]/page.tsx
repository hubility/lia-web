import { requirePermission } from "@/lib/auth/guards";
import { getPatientDetail } from "@/lib/modules/patients/service";
import { listCatalogItems } from "@/lib/modules/catalog/service";
import { PatientDetail } from "@/components/patients/patient-detail";

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("patients", "read");
  const { id } = await params;
  const [patient, catalog] = await Promise.all([getPatientDetail(id), listCatalogItems(false)]);
  return <PatientDetail patient={patient} catalog={catalog} />;
}
