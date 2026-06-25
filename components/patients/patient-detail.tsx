"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { WhatsappIcon, Calendar01Icon, PencilEdit01Icon, Add01Icon, File01Icon, Delete02Icon, Invoice01Icon, PrescriptionIcon, Certificate01Icon } from "@hugeicons/core-free-icons";
import { deleteQuoteAction, deletePrescriptionAction, deleteCertificateAction } from "@/app/(dashboard)/pacientes/[id]/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { calculateAge, quoteValueCents } from "@/lib/patients/derive";
import type { CatalogItem } from "@prisma/client";
import type { PatientDetailData } from "@/lib/modules/patients/service";
import { PatientSheet } from "@/components/patients/patient-sheet";
import { OdontogramTab } from "@/components/patients/odontogram/odontogram-tab";
import { QuoteEditor, type QuoteEditorQuote } from "@/components/patients/quotes/quote-editor";
import { PrescriptionEditor, type PrescriptionEditorPrescription } from "@/components/patients/prescriptions/prescription-editor";
import { CertificateEditor, type CertificateEditorCertificate } from "@/components/patients/certificates/certificate-editor";

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
  const [editingQuote, setEditingQuote] = useState<"new" | QuoteEditorQuote | null>(null);
  const [editingPrescription, setEditingPrescription] = useState<"new" | PrescriptionEditorPrescription | null>(null);
  const [editingCertificate, setEditingCertificate] = useState<"new" | CertificateEditorCertificate | null>(null);

  function handleDeleteQuote(quoteId: string) {
    if (!confirm("Excluir orçamento?")) return;
    startTransition(async () => {
      await deleteQuoteAction(quoteId, patient.id);
      router.refresh();
    });
  }

  function handleDeletePrescription(prescriptionId: string) {
    if (!confirm("Excluir receita?")) return;
    startTransition(async () => {
      await deletePrescriptionAction(prescriptionId, patient.id);
      router.refresh();
    });
  }

  function handleDeleteCertificate(certificateId: string) {
    if (!confirm("Excluir atestado?")) return;
    startTransition(async () => {
      await deleteCertificateAction(certificateId, patient.id);
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
          <Link
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-sm px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider transition-colors",
              tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )} href={""}          >
            {t.label}
          </Link>
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
        editingQuote !== null ? (
          <QuoteEditor
            patient={{ id: patient.id, name: patient.name, phone: patient.phone, cpf: patient.cpf, recordNumber: patient.recordNumber }}
            catalog={catalog}
            quote={editingQuote === "new" ? undefined : editingQuote}
            onCancel={() => setEditingQuote(null)}
            onSaved={() => {
              setEditingQuote(null);
              router.refresh();
            }}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {patient.quotes.length > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setEditingQuote("new")}
                  className="inline-flex h-8 items-center gap-1 rounded-md bg-secondary px-2.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/70"
                >
                  <HugeiconsIcon icon={Add01Icon} size={13} strokeWidth={2} />
                  Novo orçamento
                </button>
              </div>
            )}
            {patient.quotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-card px-6 py-14 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground">
                  <HugeiconsIcon icon={Invoice01Icon} size={22} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-foreground">Nenhum orçamento ainda</p>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    Monte um orçamento profissional a partir do catálogo de procedimentos ou de itens livres.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingQuote("new")}
                  className="mt-1 inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
                  Criar primeiro orçamento
                </button>
              </div>
            ) : (
              <div className="rounded-md border bg-card">
                {(
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
                        onClick={() =>
                          setEditingQuote({
                            id: q.id,
                            number: q.number,
                            issueDate: q.issueDate,
                            paymentMethod: q.paymentMethod,
                            validityDays: q.validityDays,
                            discountCents: q.discountCents,
                            notes: q.notes,
                            lines: q.lines.map((l) => ({
                              catalogItemId: l.catalogItemId,
                              description: l.description,
                              quantity: l.quantity,
                              unitPriceCents: l.unitPriceCents,
                            })),
                          })
                        }
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
            )}
          </div>
        )
      )}

      {tab === "receitas" && (
        editingPrescription !== null ? (
          <PrescriptionEditor
            patient={{ id: patient.id, name: patient.name, phone: patient.phone, cpf: patient.cpf, recordNumber: patient.recordNumber }}
            prescription={editingPrescription === "new" ? undefined : editingPrescription}
            onCancel={() => setEditingPrescription(null)}
            onSaved={() => {
              setEditingPrescription(null);
              router.refresh();
            }}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {patient.prescriptions.length > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setEditingPrescription("new")}
                  className="inline-flex h-8 items-center gap-1 rounded-md bg-secondary px-2.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/70"
                >
                  <HugeiconsIcon icon={Add01Icon} size={13} strokeWidth={2} />
                  Nova receita
                </button>
              </div>
            )}
            {patient.prescriptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-card px-6 py-14 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground">
                  <HugeiconsIcon icon={PrescriptionIcon} size={22} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-foreground">Nenhuma receita ainda</p>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    Monte uma receita com os medicamentos e instruções de uso para o paciente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPrescription("new")}
                  className="mt-1 inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
                  Criar primeira receita
                </button>
              </div>
            ) : (
              <div className="rounded-md border bg-card">
                {patient.prescriptions.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 border-b px-3 py-2.5 last:border-b-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">
                        Receita · {p.items.length} {p.items.length === 1 ? "item" : "itens"}
                      </p>
                      <p className="font-mono text-xs tabular-nums text-muted-foreground">{formatDate(p.issueDate)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <a
                        href={`/api/pdf/receitas/${p.id}`}
                        aria-label="PDF"
                        className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <HugeiconsIcon icon={File01Icon} size={14} strokeWidth={1.75} />
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingPrescription({
                            id: p.id,
                            issueDate: p.issueDate,
                            notes: p.notes,
                            items: p.items.map((i) => ({ medicine: i.medicine, instructions: i.instructions })),
                          })
                        }
                        aria-label="Editar"
                        className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <HugeiconsIcon icon={PencilEdit01Icon} size={14} strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDeletePrescription(p.id)}
                        aria-label="Excluir"
                        className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive disabled:opacity-50"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      )}

      {tab === "atestados" && (
        editingCertificate !== null ? (
          <CertificateEditor
            patient={{ id: patient.id, name: patient.name, phone: patient.phone, cpf: patient.cpf, recordNumber: patient.recordNumber }}
            certificate={editingCertificate === "new" ? undefined : editingCertificate}
            onCancel={() => setEditingCertificate(null)}
            onSaved={() => {
              setEditingCertificate(null);
              router.refresh();
            }}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {patient.certificates.length > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setEditingCertificate("new")}
                  className="inline-flex h-8 items-center gap-1 rounded-md bg-secondary px-2.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/70"
                >
                  <HugeiconsIcon icon={Add01Icon} size={13} strokeWidth={2} />
                  Novo atestado
                </button>
              </div>
            )}
            {patient.certificates.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-card px-6 py-14 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground">
                  <HugeiconsIcon icon={Certificate01Icon} size={22} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-foreground">Nenhum atestado ainda</p>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    Emita um atestado de afastamento com o período, o CID e as observações para o paciente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCertificate("new")}
                  className="mt-1 inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
                  Criar primeiro atestado
                </button>
              </div>
            ) : (
              <div className="rounded-md border bg-card">
                {patient.certificates.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 border-b px-3 py-2.5 last:border-b-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">Atestado · CID {c.cid}</p>
                      <p className="font-mono text-xs tabular-nums text-muted-foreground">
                        {formatDate(c.absenceStartDate)} – {formatDate(c.absenceEndDate)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <a
                        href={`/api/pdf/atestados/${c.id}`}
                        aria-label="PDF"
                        className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <HugeiconsIcon icon={File01Icon} size={14} strokeWidth={1.75} />
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingCertificate({
                            id: c.id,
                            issueDate: c.issueDate,
                            absenceStartDate: c.absenceStartDate,
                            absenceEndDate: c.absenceEndDate,
                            cid: c.cid,
                            city: c.city,
                            notes: c.notes,
                          })
                        }
                        aria-label="Editar"
                        className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <HugeiconsIcon icon={PencilEdit01Icon} size={14} strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDeleteCertificate(c.id)}
                        aria-label="Excluir"
                        className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive disabled:opacity-50"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
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
