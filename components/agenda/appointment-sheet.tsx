"use client";

import { useEffect, useState, useTransition } from "react";
import type { Appointment, AppointmentStatus, CatalogItem, Patient } from "@prisma/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  createAppointmentAction,
  deleteAppointmentAction,
  setAppointmentStatusAction,
  updateAppointmentAction,
} from "@/app/(dashboard)/agenda/actions";

type Mode = "create" | "edit";

interface BaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: Patient[];
  catalog: CatalogItem[];
}

interface CreateProps extends BaseProps {
  mode: "create";
  defaultDate?: Date;
}

interface EditProps extends BaseProps {
  mode: "edit";
  appointment: Appointment;
}

export type AppointmentSheetProps = CreateProps | EditProps;

function toInputDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: "scheduled", label: "Agendada" },
  { value: "confirmed", label: "Confirmada" },
  { value: "completed", label: "Concluída" },
  { value: "cancelled", label: "Cancelada" },
];

export function AppointmentSheet(props: AppointmentSheetProps) {
  const { open, onOpenChange, patients, catalog, mode } = props;
  const appointment = mode === "edit" ? props.appointment : null;
  const defaultDate = mode === "create" ? props.defaultDate ?? new Date() : null;

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (mode === "edit" && appointment) {
          await updateAppointmentAction(appointment.id, formData);
        } else {
          await createAppointmentAction(formData);
        }
        onOpenChange(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao salvar");
      }
    });
  }

  async function handleStatus(status: AppointmentStatus) {
    if (!appointment) return;
    setError(null);
    startTransition(async () => {
      try {
        await setAppointmentStatusAction(appointment.id, status);
        onOpenChange(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  async function handleDelete() {
    if (!appointment) return;
    if (!confirm("Excluir consulta?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteAppointmentAction(appointment.id);
        onOpenChange(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  const initialStartsAt = appointment
    ? toInputDateTime(new Date(appointment.startsAt))
    : defaultDate
    ? toInputDateTime(defaultDate)
    : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{mode === "edit" ? "Editar consulta" : "Nova consulta"}</SheetTitle>
          <SheetDescription>
            {mode === "edit"
              ? "Atualize os dados ou altere o status da consulta."
              : "Agende uma nova consulta no calendário."}
          </SheetDescription>
        </SheetHeader>

        <form action={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {mode === "edit" && (
            <div className="flex flex-wrap gap-1.5 rounded-md bg-secondary/50 p-2">
              {STATUS_OPTIONS.map((opt) => {
                const active = appointment?.status === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleStatus(opt.value)}
                    disabled={isPending || active}
                    className={cn(
                      "rounded-sm px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider transition-colors",
                      active
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          <Field label="Paciente">
            <select
              name="patientId"
              required
              defaultValue={appointment?.patientId ?? ""}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecionar paciente…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Procedimento">
            <select
              name="catalogItemId"
              defaultValue={appointment?.catalogItemId ?? ""}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">— Nenhum —</option>
              {catalog.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Título">
            <input
              name="title"
              required
              defaultValue={appointment?.title ?? ""}
              placeholder="Ex.: Canal radicular · sessão 1/3"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Início">
              <input
                name="startsAt"
                type="datetime-local"
                required
                defaultValue={initialStartsAt}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Duração (min)">
              <input
                name="durationMinutes"
                type="number"
                min={5}
                step={5}
                required
                defaultValue={appointment?.durationMinutes ?? 60}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </Field>
          </div>

          <Field label="Status">
            <select
              name="status"
              defaultValue={appointment?.status ?? "scheduled"}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Observações">
            <textarea
              name="notes"
              rows={3}
              defaultValue={appointment?.notes ?? ""}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                  className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
