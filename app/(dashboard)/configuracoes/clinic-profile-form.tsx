"use client";

import { useActionState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ClinicIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { ClinicProfileInput } from "@/lib/clinic/profile";
import {
  type ClinicProfileFormState,
  updateClinicProfileAction,
} from "./actions";

const INITIAL_CLINIC_PROFILE_FORM_STATE: ClinicProfileFormState = {
  status: "idle",
  message: "",
};

const fieldClass =
  "h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring";

export function ClinicProfileForm({ profile }: { profile: ClinicProfileInput }) {
  const [state, formAction, pending] = useActionState(
    updateClinicProfileAction,
    INITIAL_CLINIC_PROFILE_FORM_STATE
  );

  return (
    <form action={formAction} className="border-t border-border">
      <div className="grid gap-6 py-6 md:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] md:gap-12">
        <div className="flex gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
            <HugeiconsIcon icon={ClinicIcon} size={18} strokeWidth={1.7} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">Dados da clínica</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
              Identificação e contato impressos no rodapé e na assinatura dos orçamentos,
              receitas e atestados.
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <div className="grid gap-3">
            <TextField id="name" label="Nome" defaultValue={profile.name} />
            <div className="grid grid-cols-2 gap-3">
              <TextField
                id="specialty"
                label="Especialidade"
                defaultValue={profile.specialty}
              />
              <TextField id="cro" label="CRO" defaultValue={profile.cro} mono />
            </div>
            <TextField id="phone" label="Telefone" defaultValue={profile.phone} mono />
            <TextField id="address" label="Endereço" defaultValue={profile.address} />
            <TextField id="cityLine" label="Cidade e CEP" defaultValue={profile.cityLine} />
            <TextField id="website" label="Site" defaultValue={profile.website} />
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
              {state.message}
            </p>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Salvando…" : "Salvar dados"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function TextField({
  id,
  label,
  defaultValue,
  mono = false,
}: {
  id: string;
  label: string;
  defaultValue: string;
  mono?: boolean;
}) {
  return (
    <label htmlFor={id} className="flex min-w-0 flex-col gap-1.5">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        id={id}
        name={id}
        type="text"
        required
        defaultValue={defaultValue}
        className={cn(fieldClass, mono && "font-mono tabular-nums")}
      />
    </label>
  );
}
