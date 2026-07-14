"use client";

import { useState, useTransition, type ReactNode } from "react";
import type { Medication } from "@prisma/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  createMedicationAction,
  deleteMedicationAction,
  toggleMedicationAction,
  updateMedicationAction,
} from "@/app/(dashboard)/catalogo/actions";

interface BaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
interface CreateProps extends BaseProps {
  mode: "create";
}
interface EditProps extends BaseProps {
  mode: "edit";
  item: Medication;
}
type Props = CreateProps | EditProps;

const inputClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export function MedicationSheet(props: Props) {
  const { open, onOpenChange, mode } = props;
  const item = mode === "edit" ? props.item : null;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  /** Al cerrar se limpia el error, para que no reaparezca en la próxima apertura. */
  function changeOpen(next: boolean) {
    if (!next) setError(null);
    onOpenChange(next);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (mode === "edit" && item) {
          await updateMedicationAction(item.id, formData);
        } else {
          await createMedicationAction(formData);
        }
        onOpenChange(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao salvar");
      }
    });
  }

  function handleToggle() {
    if (!item) return;
    setError(null);
    startTransition(async () => {
      try {
        await toggleMedicationAction(item.id, !item.isActive);
        onOpenChange(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  function handleDelete() {
    if (!item) return;
    if (!confirm("Excluir medicamento?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteMedicationAction(item.id);
        onOpenChange(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={changeOpen}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{mode === "edit" ? "Editar medicamento" : "Novo medicamento"}</SheetTitle>
          <SheetDescription>
            {mode === "edit"
              ? "Atualize os dados do medicamento."
              : "Cadastre um medicamento do catálogo."}
          </SheetDescription>
        </SheetHeader>

        <form action={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <Field label="Nome">
            <input
              name="name"
              required
              defaultValue={item?.name ?? ""}
              placeholder="Ex.: Amoxicilina 500mg"
              className={inputClass}
            />
          </Field>
          <Field label="Posologia padrão">
            <textarea
              name="defaultPosology"
              required
              rows={3}
              defaultValue={item?.defaultPosology ?? ""}
              placeholder="Ex.: Tomar 1 cápsula de 8/8h, por 7 dias."
              className={inputClass}
            />
          </Field>

          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <SheetFooter className="-mx-4 -mb-4 mt-auto border-t p-4">
            <div className="flex w-full items-center justify-between gap-2">
              {mode === "edit" ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggle}
                    disabled={isPending}
                    className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                  >
                    {item?.isActive ? "Inativar" : "Ativar"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="rounded-md border border-destructive/40 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                  >
                    Excluir
                  </button>
                </div>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => changeOpen(false)}
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
