"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Appointment, CatalogItem, Patient } from "@/app/generated/prisma/client";
import { cn } from "@/lib/utils";
import { addDays, formatIsoDate, isSameDay, startOfMonth, startOfWeek } from "@/lib/agenda/range";
import { procedureColorVar } from "@/lib/agenda/colors";

const DAY_LABELS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

type AppointmentWithRelations = Appointment & {
  patient: Patient;
  catalogItem: CatalogItem | null;
};

interface MonthViewProps {
  date: Date;
  appointments: AppointmentWithRelations[];
}

function buildMonthGrid(date: Date): Date[] {
  const start = startOfWeek(startOfMonth(date));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function MonthView({ date, appointments }: MonthViewProps) {
  const pathname = usePathname();
  const today = new Date();
  const cells = buildMonthGrid(date);
  const currentMonth = date.getMonth();

  const apptByDay = new Map<string, AppointmentWithRelations[]>();
  for (const a of appointments) {
    const key = formatIsoDate(new Date(a.startsAt));
    const arr = apptByDay.get(key) ?? [];
    arr.push(a);
    apptByDay.set(key, arr);
  }

  return (
    <div>
      <div className="grid grid-cols-7 border-y border-border">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="border-l border-border px-2 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground first:border-l-0"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6">
        {cells.map((cell, i) => {
          const inMonth = cell.getMonth() === currentMonth;
          const isToday = isSameDay(cell, today);
          const key = formatIsoDate(cell);
          const items = apptByDay.get(key) ?? [];
          return (
            <Link
              key={i}
              href={`${pathname}?view=day&date=${key}`}
              className={cn(
                "flex min-h-28 flex-col gap-1 border-b border-l border-border p-2 transition-colors hover:bg-secondary/40",
                !inMonth && "bg-muted/30",
                isToday && "bg-primary/5"
              )}
            >
              <div className="flex items-baseline justify-between">
                <span
                  className={cn(
                    "font-mono text-sm tabular-nums",
                    !inMonth && "text-muted-foreground/50",
                    isToday ? "font-semibold text-primary" : "text-foreground"
                  )}
                >
                  {cell.getDate()}
                </span>
                {items.length > 0 && (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {items.length}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                {items.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-1.5 truncate rounded-sm bg-card px-1.5 py-0.5 text-[10px]"
                    style={{
                      borderLeft: `2px solid ${procedureColorVar(a.catalogItemId ?? a.title)}`,
                    }}
                  >
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {new Date(a.startsAt).getHours().toString().padStart(2, "0")}:
                      {new Date(a.startsAt).getMinutes().toString().padStart(2, "0")}
                    </span>
                    <span className="truncate text-foreground">{a.patient.name}</span>
                  </div>
                ))}
                {items.length > 3 && (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    +{items.length - 3}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
