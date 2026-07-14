import { requirePermission } from "@/lib/auth/guards";
import { getPatientDetail } from "@/lib/modules/patients/service";
import { listCatalogItems } from "@/lib/modules/catalog/service";
import { listMedications } from "@/lib/modules/medications/service";
import { listCidCodes } from "@/lib/modules/cid/service";
import { PatientDetail } from "@/components/patients/patient-detail";

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("patients", "read");
  const { id } = await params;
  const [patient, catalog, medications, cidCodes] = await Promise.all([
    getPatientDetail(id),
    listCatalogItems(false),
    listMedications(false),
    listCidCodes(false),
  ]);
  return (
    <PatientDetail
      patient={patient}
      catalog={catalog}
      medications={medications}
      cidCodes={cidCodes}
    />
  );
}
