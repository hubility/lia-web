import { requirePermission } from "@/lib/auth/guards";
import { getPatientDetail } from "@/lib/modules/patients/service";
import { PatientDetail } from "@/components/patients/patient-detail";

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("patients", "read");
  const { id } = await params;
  const patient = await getPatientDetail(id);
  return <PatientDetail patient={patient} />;
}
