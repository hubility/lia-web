"use client";

import { useActionState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { formatClockMinutes } from "@/lib/agenda/schedule";
import {
  type ScheduleFormState,
  updateClinicScheduleAction,
} from "./actions";

const INITIAL_SCHEDULE_FORM_STATE: ScheduleFormState = {
  status: "idle",
  message: "",
};

export function ScheduleForm({
  opensAtMinutes,
  closesAtMinutes,
}: {
  opensAtMinutes: number;
  closesAtMinutes: number;
}) {
  const [state, formAction, pending] = useActionState(
    updateClinicScheduleAction,
    INITIAL_SCHEDULE_FORM_STATE
  );

  return (
    <form action={formAction} className="border-t border-border">
      <div className="grid gap-6 py-6 md:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] md:gap-12">
        <div className="flex gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
            <HugeiconsIcon icon={Clock01Icon} size={18} strokeWidth={1.7} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">Expediente padrão</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
              Define a faixa exibida na agenda e os limites aceitos ao criar ou reagendar consultas.
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <div className="grid grid-cols-2 gap-3">
            <TimeField
              id="opensAt"
              label="Abertura"
              defaultValue={formatClockMinutes(opensAtMinutes)}
            />
            <TimeField
              id="closesAt"
              label="Encerramento"
              defaultValue={formatClockMinutes(closesAtMinutes)}
            />
          </div>

          <div className="mt-4 flex min-h-10 flex-wrap items-center justify-between gap-3">
            <p
              aria-live="polite"
              className={cn(
                "text-sm",
                state.status === "error" && "text-destructive",
                state.status === "success" && "text-success",
                state.status === "idle" && "text-muted-foreground"
              )}
            >
              {state.message || "Intervalos de 15 minutos."}
            </p>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Salvando…" : "Salvar horário"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function TimeField({
  id,
  label,
  defaultValue,
}: {
  id: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <label htmlFor={id} className="flex min-w-0 flex-col gap-1.5">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        id={id}
        name={id}
        type="time"
        step={900}
        required
        defaultValue={defaultValue}
        className="h-10 min-w-0 rounded-md border border-input bg-background px-3 font-mono text-sm tabular-nums text-foreground outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  );
}
