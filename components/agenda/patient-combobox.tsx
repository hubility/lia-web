"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { Patient } from "@prisma/client";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, PlusSignIcon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { quickCreatePatientAction } from "@/app/(dashboard)/pacientes/actions";

const inputClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export function PatientCombobox({
  patients,
  value,
  onChange,
  onCreated,
}: {
  patients: Patient[];
  value: string;
  onChange: (id: string) => void;
  onCreated: (patient: Patient) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => patients.find((p) => p.id === value) ?? null, [patients, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    const digits = q.replace(/\D/g, "");
    return patients.filter(
      (p) => p.name.toLowerCase().includes(q) || (digits !== "" && p.phone.replace(/\D/g, "").includes(digits))
    );
  }, [patients, query]);

  const trimmed = query.trim();
  const exactMatch = patients.some((p) => p.name.toLowerCase() === trimmed.toLowerCase());

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    setOpen(false);
    setQuery("");
    setCreating(false);
    setError(null);
  }

  function pick(id: string) {
    onChange(id);
    close();
  }

  function startCreate() {
    setName(trimmed);
    setPhone("");
    setError(null);
    setCreating(true);
  }

  function submitCreate() {
    if (!name.trim() || !phone.trim()) {
      setError("Nome e telefone são obrigatórios.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const patient = await quickCreatePatientAction({ name, phone });
        onCreated(patient);
        onChange(patient.id);
        close();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao criar paciente");
      }
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <span className={selected ? "truncate text-foreground" : "truncate text-muted-foreground"}>
          {selected ? selected.name : "Selecionar paciente…"}
        </span>
        <HugeiconsIcon icon={ArrowDown01Icon} size={16} strokeWidth={1.75} className="shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-12 z-20 rounded-md border bg-popover p-1.5 shadow-md">
          {creating ? (
            <div className="flex flex-col gap-2 p-1.5">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Novo paciente
              </p>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome"
                className={inputClass}
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Telefone"
                inputMode="tel"
                className={inputClass}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={submitCreate}
                  disabled={isPending}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? "Criando…" : "Criar e usar"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-1 flex items-center gap-1.5 rounded-md border px-2">
                <HugeiconsIcon icon={Search01Icon} size={14} strokeWidth={1.75} className="text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nome ou telefone"
                  className="w-full bg-transparent py-1.5 text-sm outline-none"
                />
              </div>

              <ul className="scrollbar-slim max-h-56 overflow-y-auto">
                {filtered.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => pick(p.id)}
                      className="flex w-full items-center justify-between gap-3 rounded-sm px-1.5 py-2 text-left transition-colors hover:bg-secondary"
                    >
                      <span className="truncate text-sm text-foreground">{p.name}</span>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{p.phone}</span>
                    </button>
                  </li>
                ))}
                {filtered.length === 0 && !trimmed && (
                  <li className="px-2 py-2 font-mono text-xs text-muted-foreground">Nenhum paciente.</li>
                )}
              </ul>

              {trimmed && !exactMatch && (
                <button
                  type="button"
                  onClick={startCreate}
                  className="mt-1 flex w-full items-center gap-1.5 rounded-sm border-t px-1.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary"
                >
                  <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={2} className="text-primary" />
                  Criar <span className="font-semibold">«{trimmed}»</span>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
