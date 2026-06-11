"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Patient } from "@prisma/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  createPatientAction,
  deletePatientAction,
  updatePatientAction,
} from "@/app/(dashboard)/pacientes/actions";

type Mode = "create" | "edit";

interface BaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
interface CreateProps extends BaseProps {
  mode: "create";
}
interface EditProps extends BaseProps {
  mode: "edit";
  patient: Patient;
}
type Props = CreateProps | EditProps;

const inputClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export function PatientSheet(props: Props) {
  const { open, onOpenChange, mode } = props;
  const patient = mode === "edit" ? props.patient : null;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (mode === "edit" && patient) {
          await updatePatientAction(patient.id, formData);
          onOpenChange(false);
        } else {
          const id = await createPatientAction(formData);
          onOpenChange(false);
          router.push(`/pacientes/${id}`);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao salvar");
      }
    });
  }

  function handleDelete() {
    if (!patient) return;
    if (!confirm("Excluir paciente?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deletePatientAction(patient.id);
        onOpenChange(false);
        router.push("/pacientes");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{mode === "edit" ? "Editar paciente" : "Novo paciente"}</SheetTitle>
          <SheetDescription>
            {mode === "edit"
              ? "Atualize os dados cadastrais do paciente."
              : "Cadastre os dados básicos do paciente."}
          </SheetDescription>
        </SheetHeader>

        <form action={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <Field label="Nome">
            <input name="name" required defaultValue={patient?.name ?? ""} className={inputClass} />
          </Field>
          <Field label="Telefone">
            <input name="phone" required defaultValue={patient?.phone ?? ""} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <input name="email" type="email" defaultValue={patient?.email ?? ""} className={inputClass} />
            </Field>
            <Field label="CPF">
              <input name="cpf" defaultValue={patient?.cpf ?? ""} className={inputClass} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nascimento">
              <input
                name="birthDate"
                type="date"
                defaultValue={patient?.birthDate?.toISOString().slice(0, 10) ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="Prontuário">
              <input name="recordNumber" defaultValue={patient?.recordNumber ?? ""} className={inputClass} />
            </Field>
          </div>
          <Field label="Observações">
            <textarea name="notes" rows={3} defaultValue={patient?.notes ?? ""} className={inputClass} />
          </Field>

          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <SheetFooter className="-mx-4 -mb-4 mt-auto border-t p-4">
            <div className="flex w-full items-center justify-between gap-2">
              {mode === "edit" ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="rounded-md border border-destructive/40 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  Excluir
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
