"use client";

import { useState, useTransition } from "react";
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
  cid: string;
  city: string;
  notes: string | null;
};

const inputClass = "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm";
const labelClass = "font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

const toDateInput = (d: Date) => d.toISOString().slice(0, 10);

export function CertificateEditor({
  patient,
  certificate,
  onCancel,
  onSaved,
}: {
  patient: CertificateEditorPatient;
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
  const [cid, setCid] = useState(certificate?.cid ?? "");
  const [city, setCity] = useState(certificate?.city ?? "Fortaleza");
  const [notes, setNotes] = useState(certificate?.notes ?? "");

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
          cid: cid.trim(),
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
        <label className="flex flex-col gap-1">
          <span className={labelClass}>CID</span>
          <input value={cid} onChange={(e) => setCid(e.target.value)} placeholder="Ex.: J06" className={inputClass} />
        </label>
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
