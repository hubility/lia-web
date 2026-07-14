"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { CidCode } from "@prisma/client";
import { saveCertificateAction } from "@/app/(dashboard)/pacientes/[id]/actions";

export type CertificateEditorPatient = {
  id: string;
  name: string;
  phone: string;
  cpf: string | null;
  recordNumber: string | null;
};

export type CertificateEditorCertificate = {
  id: string;
  issueDate: Date;
  absenceStartDate: Date;
  absenceEndDate: Date;
  cidCodeId: string | null;
  cid: string;
  cidDescription: string | null;
  city: string;
  notes: string | null;
};

const inputClass = "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm";
const labelClass = "font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

const toDateInput = (d: Date) => d.toISOString().slice(0, 10);

export function CertificateEditor({
  patient,
  cidCodes,
  certificate,
  onCancel,
  onSaved,
}: {
  patient: CertificateEditorPatient;
  cidCodes: CidCode[];
  certificate?: CertificateEditorCertificate;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const [issueDate, setIssueDate] = useState(toDateInput(certificate?.issueDate ?? today));
  const [absenceStartDate, setAbsenceStartDate] = useState(toDateInput(certificate?.absenceStartDate ?? today));
  const [absenceEndDate, setAbsenceEndDate] = useState(toDateInput(certificate?.absenceEndDate ?? today));
  const [cidCodeId, setCidCodeId] = useState(certificate?.cidCodeId ?? null);
  const [cid, setCid] = useState(certificate?.cid ?? "");
  const [cidDescription, setCidDescription] = useState(certificate?.cidDescription ?? null);
  const [city, setCity] = useState(certificate?.city ?? "Fortaleza");
  const [notes, setNotes] = useState(certificate?.notes ?? "");

  const [cidOpen, setCidOpen] = useState(false);
  const cidRef = useRef<HTMLDivElement>(null);

  const filteredCids = useMemo(() => {
    const q = cid.trim().toLowerCase();
    const matched = q
      ? cidCodes.filter(
          (c) => c.code.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
        )
      : cidCodes;
    return matched.slice(0, 50);
  }, [cidCodes, cid]);

  useEffect(() => {
    if (!cidOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (!cidRef.current?.contains(e.target as Node)) setCidOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [cidOpen]);

  function pickCid(code: CidCode) {
    setCidCodeId(code.id);
    setCid(code.code);
    setCidDescription(code.description);
    setCidOpen(false);
  }

  function handleSave() {
    if (!cid.trim()) {
      setError("Informe o CID.");
      return;
    }
    if (!city.trim()) {
      setError("Informe a cidade.");
      return;
    }
    if (absenceEndDate < absenceStartDate) {
      setError("Data final não pode ser anterior à inicial.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await saveCertificateAction({
          certificateId: certificate?.id,
          patientId: patient.id,
          issueDate,
          absenceStartDate,
          absenceEndDate,
          cidCodeId,
          cid: cid.trim(),
          cidDescription,
          city: city.trim(),
          notes: notes.trim() || null,
        });
        onSaved();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao salvar atestado");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b pb-3">
        <div>
          <h1 className="text-base font-semibold text-foreground">
            {certificate ? "Editar atestado" : "Novo atestado"}
          </h1>
          <p className="font-mono text-xs text-muted-foreground">{patient.name}</p>
        </div>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Data de emissão</span>
          <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={inputClass} />
        </label>
      </header>

      <section className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-md border bg-card p-3 text-sm md:grid-cols-4">
        <Info label="Paciente" value={patient.name} />
        <Info label="Telefone" value={patient.phone} />
        <Info label="CPF" value={patient.cpf ?? "—"} />
        <Info label="Prontuário" value={patient.recordNumber ?? "—"} />
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Afastamento — início</span>
          <input
            type="date"
            value={absenceStartDate}
            onChange={(e) => setAbsenceStartDate(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Afastamento — fim</span>
          <input
            type="date"
            value={absenceEndDate}
            onChange={(e) => setAbsenceEndDate(e.target.value)}
            className={inputClass}
          />
        </label>
        <div className="relative flex flex-col gap-1" ref={cidRef}>
          <span className={labelClass}>CID</span>
          {/* Teclear a mano rompe el vínculo con el catálogo: el código deja de ser el elegido. */}
          <input
            value={cid}
            onChange={(e) => {
              setCid(e.target.value);
              setCidCodeId(null);
              setCidDescription(null);
              setCidOpen(true);
            }}
            onFocus={() => setCidOpen(true)}
            placeholder="Buscar por código ou descrição"
            className={inputClass}
          />
          {cidDescription && !cidOpen && (
            <span className="truncate text-xs text-muted-foreground">{cidDescription}</span>
          )}

          {cidOpen && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border bg-popover p-1.5 shadow-md">
              {filteredCids.length === 0 ? (
                <p className="px-2 py-2 font-mono text-xs text-muted-foreground">
                  Nenhum CID no catálogo.
                </p>
              ) : (
                <ul className="max-h-56 overflow-y-auto">
                  {filteredCids.map((code) => (
                    <li key={code.id}>
                      <button
                        type="button"
                        onClick={() => pickCid(code)}
                        className="flex w-full items-baseline gap-2 rounded-sm px-1.5 py-2 text-left transition-colors hover:bg-secondary"
                      >
                        <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-foreground">
                          {code.code}
                        </span>
                        <span className="truncate text-sm text-muted-foreground">
                          {code.description}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Cidade</span>
          <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 md:col-span-2">
          <span className={labelClass}>Observações</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} />
        </label>
      </section>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 border-t pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className={labelClass}>{label}</span>
      <span className="truncate text-sm text-foreground">{value}</span>
    </div>
  );
}
