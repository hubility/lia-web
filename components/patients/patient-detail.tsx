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
import { PatientSheet } from "@/components/patients/patient-sheet";

type Tab = "resumo" | "consultas" | "orcamentos" | "receitas" | "atestados";

const TABS: { id: Tab; label: string }[] = [
  { id: "resumo", label: "Resumo" },
  { id: "consultas", label: "Consultas" },
  { id: "orcamentos", label: "Orçamentos" },
  { id: "receitas", label: "Receitas" },
  { id: "atestados", label: "Atestados" },
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
  const [editOpen, setEditOpen] = useState(false);

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
      <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{initials(patient.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-foreground">{patient.name}</h1>
            <p className="font-mono text-xs tabular-nums text-muted-foreground">
              {patient.birthDate ? `${calculateAge(patient.birthDate)} anos · ` : ""}
              {patient.recordNumber ? `nº ${patient.recordNumber} · ` : ""}
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
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <HugeiconsIcon icon={WhatsappIcon} size={16} strokeWidth={1.75} />
          </a>
          <Link
            href="/agenda"
            aria-label="Agendar"
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <HugeiconsIcon icon={Calendar01Icon} size={16} strokeWidth={1.75} />
          </Link>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <HugeiconsIcon icon={PencilEdit01Icon} size={14} strokeWidth={2} />
            Editar
          </button>
        </div>
      </header>

      <div className="flex w-fit items-center gap-0.5 rounded-md bg-secondary p-0.5">
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
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Próxima consulta" value={nextAppt ? formatDateTime(nextAppt.startsAt) : "—"} />
          <SummaryCard label="Última visita" value={lastVisit ? formatDate(lastVisit.startsAt) : "—"} />
          <SummaryCard label="Total orçado" value={formatBRL(totalQuoted)} />
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
            <Row
              key={q.id}
              left={`Orçamento ${q.number}`}
              meta={formatDate(q.issueDate)}
              right={formatBRL(quoteValueCents(q))}
            />
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
            <Row
              key={c.id}
              left={`CID ${c.cid}`}
              meta={`${formatDate(c.absenceStartDate)} – ${formatDate(c.absenceEndDate)}`}
            />
          )}
        </Section>
      )}

      <PatientSheet mode="edit" patient={patient} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 font-mono text-sm tabular-nums text-foreground">{value}</p>
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
    <div className="rounded-md border bg-card">
      {items.length === 0 ? (
        <p className="p-3 font-mono text-xs text-muted-foreground">{empty}</p>
      ) : (
        items.map(children)
      )}
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
    <div className={cn("flex items-center justify-between gap-3 border-b px-3 py-2.5 last:border-b-0", muted && "opacity-50")}>
      <div className="min-w-0">
        <p className={cn("truncate text-sm text-foreground", muted && "line-through")}>{left}</p>
        <p className="font-mono text-xs tabular-nums text-muted-foreground">{meta}</p>
      </div>
      {right && (
        <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{right}</span>
      )}
    </div>
  );
}
