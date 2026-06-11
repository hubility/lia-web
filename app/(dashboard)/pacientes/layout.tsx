import { requirePermission } from "@/lib/auth/guards";
import { listPatientDirectory } from "@/lib/modules/patients/service";
import { PatientList } from "@/components/patients/patient-list";

export default async function PatientsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("patients", "read");
  const patients = await listPatientDirectory();

  return (
    <div className="flex h-full">
      <PatientList patients={patients} />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pl-6">{children}</div>
    </div>
  );
}
