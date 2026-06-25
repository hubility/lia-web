"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { WhatsappIcon, Calendar01Icon, PencilEdit01Icon, Add01Icon, File01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { deleteQuoteAction } from "@/app/(dashboard)/pacientes/[id]/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { calculateAge, quoteValueCents } from "@/lib/patients/derive";
import type { CatalogItem } from "@prisma/client";
import type { PatientDetailData } from "@/lib/modules/patients/service";
import { PatientSheet } from "@/components/patients/patient-sheet";
import { OdontogramTab } from "@/components/patients/odontogram/odontogram-tab";

type Tab = "odontograma" | "consultas" | "orcamentos" | "receitas" | "atestados";

const TABS: { id: Tab; label: string }[] = [
  { id: "odontograma", label: "Odontograma" },
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

export function PatientDetail({ patient, catalog }: { patient: PatientDetailData; catalog: CatalogItem[] }) {
  const [tab, setTab] = useState<Tab>("odontograma");
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDeleteQuote(quoteId: string) {
    if (!confirm("Excluir orçamento?")) return;
    startTransition(async () => {
      await deleteQuoteAction(quoteId, patient.id);
      router.refresh();
    });
  }

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

      {tab === "odontograma" && (
        <OdontogramTab
          patientId={patient.id}
          treatments={patient.toothTreatments}
          catalog={catalog}
        />
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
        <div className="flex flex-col gap-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push(`/pacientes/${patient.id}/orcamentos/novo`)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
              Novo orçamento
            </button>
          </div>
          <div className="rounded-md border bg-card">
            {patient.quotes.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-6 text-center">
                <p className="font-mono text-xs text-muted-foreground">Sem orçamentos.</p>
                <button
                  type="button"
                  onClick={() => router.push(`/pacientes/${patient.id}/orcamentos/novo`)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Criar o primeiro orçamento
                </button>
              </div>
            ) : (
              patient.quotes.map((q) => (
                <div key={q.id} className="flex items-center justify-between gap-3 border-b px-3 py-2.5 last:border-b-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">Orçamento {q.number}</p>
                    <p className="font-mono text-xs tabular-nums text-muted-foreground">{formatDate(q.issueDate)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">{formatBRL(quoteValueCents(q))}</span>
                    <a
                      href={`/api/pdf/orcamentos/${q.id}`}
                      aria-label="PDF"
                      className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <HugeiconsIcon icon={File01Icon} size={14} strokeWidth={1.75} />
                    </a>
                    <button
                      type="button"
                      onClick={() => router.push(`/pacientes/${patient.id}/orcamentos/${q.id}`)}
                      aria-label="Editar"
                      className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <HugeiconsIcon icon={PencilEdit01Icon} size={14} strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDeleteQuote(q.id)}
                      aria-label="Excluir"
                      className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive disabled:opacity-50"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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
