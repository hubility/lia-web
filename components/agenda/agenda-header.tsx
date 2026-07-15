"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import type { CatalogItem, Patient } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  type AgendaView,
  addDays,
  formatIsoDate,
  isSameDay,
  startOfWeek,
} from "@/lib/agenda/range";
import { AppointmentSheet } from "@/components/agenda/appointment-sheet";

interface AgendaHeaderProps {
  view: AgendaView;
  date: Date;
  patients: Patient[];
  catalog: CatalogItem[];
}

const MONTHS_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function buildLabel(view: AgendaView, date: Date): string {
  if (view === "day") {
    return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
  }
  if (view === "month") {
    return `${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
  }
  const start = startOfWeek(date);
  const end = addDays(start, 5);
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} ${MONTHS_SHORT[start.getMonth()]}`;
  }
  return `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]} – ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]}`;
}

function shift(view: AgendaView, date: Date, direction: -1 | 1): Date {
  if (view === "day") return addDays(date, direction);
  if (view === "week") return addDays(date, direction * 7);
  const next = new Date(date.getFullYear(), date.getMonth() + direction, 1);
  return next;
}

export function AgendaHeader({ view, date, patients, catalog }: AgendaHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [newOpen, setNewOpen] = useState(false);

  const label = useMemo(() => buildLabel(view, date), [view, date]);
  const today = new Date();
  const isCurrentPeriod =
    view === "day"
      ? isSameDay(date, today)
      : view === "week"
        ? isSameDay(startOfWeek(date), startOfWeek(today))
        : date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();

  function navigate(nextView: AgendaView, nextDate: Date) {
    const params = new URLSearchParams(searchParams);
    params.set("view", nextView);
    params.set("date", formatIsoDate(nextDate));
    router.push(`${pathname}?${params.toString()}`);
  }

  function goToday() {
    navigate(view, new Date());
  }

  const views: { value: AgendaView; label: string }[] = [
    { value: "day", label: "DIA" },
    { value: "week", label: "SEMANA" },
    { value: "month", label: "MÊS" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex h-9 items-center gap-0.5">
          <button
            type="button"
            onClick={() => navigate(view, shift(view, date, -1))}
            className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Anterior"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={1.75} />
          </button>
          <span className="min-w-24 px-1.5 text-center font-mono text-sm font-medium tabular-nums text-foreground sm:min-w-28">
            {label}
          </span>
          <button
            type="button"
            onClick={() => navigate(view, shift(view, date, 1))}
            className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Próximo"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={1.75} />
          </button>
        </div>

        <button
          type="button"
          onClick={goToday}
          disabled={isCurrentPeriod}
          aria-current={isCurrentPeriod ? "date" : undefined}
          className="h-9 rounded-md px-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-40"
        >
          Hoje
        </button>

        <div className="flex h-9 items-center rounded-md bg-secondary p-0.5">
          {views.map((v) => {
            const active = v.value === view;
            return (
              <Link
                key={v.value}
                href={`${pathname}?view=${v.value}&date=${formatIsoDate(date)}`}
                scroll={false}
                className={cn(
                  "flex h-8 items-center rounded-sm px-3 font-mono text-xs font-semibold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  active
                    ? "bg-secondary-foreground/[0.08] text-foreground ring-1 ring-inset ring-border/70"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v.label}
              </Link>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setNewOpen(true)}
        className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
      >
        <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />
        Nova consulta
      </button>

      <AppointmentSheet
        mode="create"
        open={newOpen}
        onOpenChange={setNewOpen}
        patients={patients}
        catalog={catalog}
      />
    </div>
  );
}
