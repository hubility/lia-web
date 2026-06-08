"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { WhatsappIcon, Calendar01Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { calculateAge, quoteValueCents } from "@/lib/patients/derive";
import type { PatientDetailData } from "@/lib/modules/patients/service";
import { PatientForm } from "@/app/(dashboard)/pacientes/patient-form";
import { deletePatientAction, updatePatientAction } from "@/app/(dashboard)/pacientes/actions";

type Tab = "resumo" | "consultas" | "orcamentos" | "receitas" | "atestados" | "dados";

const TABS: { id: Tab; label: string }[] = [
  { id: "resumo", label: "Resumo" },
  { id: "consultas", label: "Consultas" },
  { id: "orcamentos", label: "Orçamentos" },
  { id: "receitas", label: "Receitas" },
  { id: "atestados", label: "Atestados" },
  { id: "dados", label: "Dados" },
];

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Agendada",
  confirmed: "Confirmada",
  completed: "Concluída",
  cancelled: "Cancelada",
};

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function onlyDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function PatientDetail({ patient }: { patient: PatientDetailData }) {
  const [tab, setTab] = useState<Tab>("resumo");

  const now = Date.now();
  const upcoming = patient.appointments.filter(
    (a) => a.startsAt.getTime() > now && a.status !== "cancelled"
  );
  const past = patient.appointments.filter((a) => a.startsAt.getTime() <= now);
  // appointments vienen en orden desc: el más próximo futuro es el último del tramo futuro.
  const nextAppt = upcoming[upcoming.length - 1];
  const lastVisit = past[0];
  const totalQuoted = patient.quotes.reduce((sum, q) => sum + quoteValueCents(q), 0);

  return (
    <div className="flex flex-col gap-4">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b bg-background/95 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback>{initials(patient.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{patient.name}</h1>
            <p className="font-mono text-xs tabular-nums text-muted-foreground">
              {patient.birthDate ? `${calculateAge(patient.birthDate)} anos · ` : ""}
              {patient.recordNumber ? `Prontuário ${patient.recordNumber} · ` : ""}
              {patient.phone}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <a
            href={`https://wa.me/${onlyDigits(patient.phone)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <HugeiconsIcon icon={WhatsappIcon} size={18} strokeWidth={1.75} />
          </a>
          <Link
            href="/agenda"
            aria-label="Agendar"
            className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <HugeiconsIcon icon={Calendar01Icon} size={18} strokeWidth={1.75} />
          </Link>
          <button
            type="button"
            onClick={() => setTab("dados")}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <HugeiconsIcon icon={PencilEdit01Icon} size={16} strokeWidth={2} />
            Editar
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-0.5 rounded-md bg-secondary p-0.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-sm px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider transition-colors",
              tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "resumo" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Próxima consulta" value={nextAppt ? formatDateTime(nextAppt.startsAt) : "—"} />
          <SummaryCard label="Última visita" value={lastVisit ? formatDate(lastVisit.startsAt) : "—"} />
          <SummaryCard label="Total orçado" value={formatBRL(totalQuoted)} />
          <div className="rounded-lg border bg-card p-4 sm:col-span-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Documentos</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Orçamentos {patient.quotes.length} · Receitas {patient.prescriptions.length} · Atestados {patient.certificates.length}
            </p>
          </div>
        </div>
      )}

      {tab === "consultas" && (
        <Section items={patient.appointments} empty="Sem consultas.">
          {(a) => (
            <Row
              key={a.id}
              left={a.title}
              meta={formatDateTime(a.startsAt)}
              right={STATUS_LABEL[a.status]}
              muted={a.status === "cancelled"}
            />
          )}
        </Section>
      )}

      {tab === "orcamentos" && (
        <Section items={patient.quotes} empty="Sem orçamentos.">
          {(q) => (
            <Row key={q.id} left={`Orçamento ${q.number}`} meta={formatDate(q.issueDate)} right={formatBRL(quoteValueCents(q))} />
          )}
        </Section>
      )}

      {tab === "receitas" && (
        <Section items={patient.prescriptions} empty="Sem receitas.">
          {(p) => <Row key={p.id} left="Receita" meta={formatDate(p.issueDate)} />}
        </Section>
      )}

      {tab === "atestados" && (
        <Section items={patient.certificates} empty="Sem atestados.">
          {(c) => (
            <Row key={c.id} left={`CID ${c.cid}`} meta={`${formatDate(c.absenceStartDate)} – ${formatDate(c.absenceEndDate)}`} />
          )}
        </Section>
      )}

      {tab === "dados" && (
        <div className="flex flex-col gap-4">
          <PatientForm patient={patient} action={updatePatientAction.bind(null, patient.id)} />
          <form action={deletePatientAction.bind(null, patient.id)}>
            <button className="rounded-md border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
              Excluir paciente
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-medium tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function Section<T>({
  items,
  empty,
  children,
}: {
  items: T[];
  empty: string;
  children: (item: T) => ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card">
      {items.length === 0 ? <p className="p-4 text-sm text-muted-foreground">{empty}</p> : items.map(children)}
    </div>
  );
}

function Row({
  left,
  meta,
  right,
  muted,
}: {
  left: string;
  meta: string;
  right?: string;
  muted?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 border-b px-4 py-2.5 last:border-b-0", muted && "opacity-50")}>
      <div className="min-w-0">
        <p className={cn("truncate text-sm font-medium text-foreground", muted && "line-through")}>{left}</p>
        <p className="font-mono text-xs tabular-nums text-muted-foreground">{meta}</p>
      </div>
      {right && <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{right}</span>}
    </div>
  );
}
