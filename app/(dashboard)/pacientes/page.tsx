import { requirePermission } from "@/lib/auth/guards";

export default async function PatientsIndexPage() {
  await requirePermission("patients", "read");
  return (
    <div className="grid min-h-[60vh] place-items-center rounded-lg border border-dashed bg-card/40">
      <p className="text-sm text-muted-foreground">Selecione um paciente.</p>
    </div>
  );
}
