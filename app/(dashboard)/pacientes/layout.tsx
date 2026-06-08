import { requirePermission } from "@/lib/auth/guards";
import { listPatientDirectory } from "@/lib/modules/patients/service";
import { PatientList } from "@/components/patients/patient-list";

export default async function PatientsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("patients", "read");
  const patients = await listPatientDirectory();

  return (
    <div className="flex gap-6">
      <PatientList patients={patients} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
