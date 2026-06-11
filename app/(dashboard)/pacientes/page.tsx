import { requirePermission } from "@/lib/auth/guards";

export default async function PatientsIndexPage() {
  await requirePermission("patients", "read");
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        Selecione um paciente
      </p>
    </div>
  );
}
