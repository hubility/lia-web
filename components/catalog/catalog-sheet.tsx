"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import type { CatalogItem } from "@prisma/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  createCatalogAction,
  deleteCatalogAction,
  toggleCatalogAction,
  updateCatalogAction,
} from "@/app/(dashboard)/catalogo/actions";

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
  item: CatalogItem;
}
type Props = CreateProps | EditProps;

const inputClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export function CatalogSheet(props: Props) {
  const { open, onOpenChange, mode } = props;
  const item = mode === "edit" ? props.item : null;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (mode === "edit" && item) {
          await updateCatalogAction(item.id, formData);
        } else {
          await createCatalogAction(formData);
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
        await toggleCatalogAction(item.id, !item.isActive);
        onOpenChange(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  function handleDelete() {
    if (!item) return;
    if (!confirm("Excluir procedimento?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteCatalogAction(item.id);
        onOpenChange(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{mode === "edit" ? "Editar procedimento" : "Novo procedimento"}</SheetTitle>
          <SheetDescription>
            {mode === "edit"
              ? "Atualize os dados do procedimento."
              : "Cadastre um procedimento do catálogo."}
          </SheetDescription>
        </SheetHeader>

        <form action={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <Field label="Nome">
            <input name="name" required defaultValue={item?.name ?? ""} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Preço">
              <input
                name="price"
                inputMode="decimal"
                required
                defaultValue={item ? (item.priceCents / 100).toFixed(2).replace(".", ",") : ""}
                className={`${inputClass} font-mono tabular-nums`}
              />
            </Field>
            <Field label="Duração (min)">
              <input
                name="durationMinutes"
                type="number"
                min={5}
                step={5}
                required
                defaultValue={item?.durationMinutes ?? 30}
                className={`${inputClass} font-mono tabular-nums`}
              />
            </Field>
          </div>
          <Field label="Descrição">
            <textarea
              name="description"
              rows={4}
              defaultValue={item?.description ?? ""}
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
