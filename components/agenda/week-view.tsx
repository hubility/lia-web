"use client";

import { useState } from "react";
import type { CatalogItem, Patient, TimeBlock } from "@prisma/client";
import { DndContext, useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { isSameDay, weekDays } from "@/lib/agenda/range";
import {
  GRID_HEIGHT,
  HOUR_START,
  HOURS,
  PX_PER_HOUR,
  PX_PER_MINUTE,
  SNAP_MINUTES,
  applyMinutesToDay,
  buildDayDropId,
} from "@/lib/agenda/dnd";
import { AppointmentSheet } from "@/components/agenda/appointment-sheet";
import {
  AppointmentCard,
  type AppointmentWithRelations,
} from "@/components/agenda/cards/appointment-card";
import { TimeBlockCard } from "@/components/agenda/cards/time-block-card";
import { useAgendaDnd } from "@/components/agenda/use-agenda-dnd";

const DAY_LABELS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const GHOST_DURATION_MINUTES = 60;

interface WeekViewProps {
  weekStart: Date;
  appointments: AppointmentWithRelations[];
  timeBlocks: TimeBlock[];
  patients: Patient[];
  catalog: CatalogItem[];
}

function snapTimeFromOffset(day: Date, offsetY: number): { date: Date; snappedMinutes: number } {
  const rawMinutes = (offsetY / PX_PER_HOUR) * 60;
  const rawSnapped = Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES;
  const snappedMinutes = Math.max(0, Math.min(HOURS * 60, rawSnapped));
  return { date: applyMinutesToDay(day, snappedMinutes), snappedMinutes };
}

function formatHM(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function WeekView({ weekStart, appointments, timeBlocks, patients, catalog }: WeekViewProps) {
  const days = weekDays(weekStart);
  const today = new Date();
  const [selected, setSelected] = useState<AppointmentWithRelations | null>(null);
  const [createAt, setCreateAt] = useState<Date | null>(null);
  const [hover, setHover] = useState<{ dayIndex: number; top: number; date: Date } | null>(null);

  const { sensors, preview, effectiveAppt, effectiveBlock, handleDragMove, handleDragEnd } =
    useAgendaDnd({ appointments, timeBlocks });

  function handleCellClick(e: React.MouseEvent<HTMLDivElement>, day: Date) {
    if (preview) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    setCreateAt(snapTimeFromOffset(day, offsetY).date);
  }

  function handleCellMove(e: React.MouseEvent<HTMLDivElement>, dayIndex: number, day: Date) {
    if (preview || e.target !== e.currentTarget) {
      setHover(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const { date, snappedMinutes } = snapTimeFromOffset(day, offsetY);
    setHover({ dayIndex, top: (snappedMinutes / 60) * PX_PER_HOUR, date });
  }

  const apptByDay = days.map((day) =>
    appointments.filter((a) => {
      const eff = effectiveAppt(a);
      return isSameDay(eff.startsAt, day);
    })
  );
  const blocksByDay = days.map((day) =>
    timeBlocks.filter((b) => {
      const eff = effectiveBlock(b);
      return isSameDay(eff.startsAt, day);
    })
  );

  return (
    <DndContext sensors={sensors} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
      <div>
        {/* Day headers */}
        <div className="grid grid-cols-[56px_repeat(6,1fr)]">
          <div />
          {days.map((day, i) => {
            const isToday = isSameDay(day, today);
            const count = apptByDay[i].length;
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "flex flex-col gap-0.5 border-y border-l border-border px-3 py-3",
                  isToday && "bg-primary/3"
                )}
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      "font-mono text-[11px] font-semibold uppercase tracking-wider",
                      isToday ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {DAY_LABELS[i]}
                  </span>
                  {isToday && (
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
                      · hoje
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      "font-mono text-2xl font-light tabular-nums",
                      isToday ? "text-primary" : "text-foreground"
                    )}
                  >
                    {day.getDate()}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {count} {count === 1 ? "consulta" : "consultas"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="relative grid grid-cols-[56px_repeat(6,1fr)]">
          {/* Hour gutter */}
          <div className="relative" style={{ height: GRID_HEIGHT }}>
            {Array.from({ length: HOURS + 1 }, (_, i) => {
              const hour = HOUR_START + i;
              return (
                <div
                  key={hour}
                  className="absolute right-2 -translate-y-1/2 font-mono text-[11px] text-muted-foreground tabular-nums"
                  style={{ top: i * PX_PER_HOUR }}
                >
                  {String(hour).padStart(2, "0")}:00
                </div>
              );
            })}
          </div>

          {/* Day columns */}
          {days.map((day, i) => (
            <DayColumn
              key={day.toISOString()}
              day={day}
              dayIndex={i}
              isToday={isSameDay(day, today)}
              appointments={apptByDay[i]}
              blocks={blocksByDay[i]}
              hover={hover}
              previewAppointmentCollisionId={
                preview && preview.collision ? preview.id : null
              }
              effectiveAppt={effectiveAppt}
              effectiveBlock={effectiveBlock}
              onCellClick={handleCellClick}
              onCellMove={handleCellMove}
              onCellLeave={() => setHover(null)}
              onSelectAppointment={setSelected}
            />
          ))}
        </div>

        {selected && (
          <AppointmentSheet
            mode="edit"
            open={Boolean(selected)}
            onOpenChange={(open) => !open && setSelected(null)}
            appointment={selected}
            patients={patients}
            catalog={catalog}
          />
        )}

        {createAt && (
          <AppointmentSheet
            mode="create"
            open={Boolean(createAt)}
            onOpenChange={(open) => !open && setCreateAt(null)}
            defaultDate={createAt}
            patients={patients}
            catalog={catalog}
          />
        )}
      </div>
    </DndContext>
  );
}

interface DayColumnProps {
  day: Date;
  dayIndex: number;
  isToday: boolean;
  appointments: AppointmentWithRelations[];
  blocks: TimeBlock[];
  hover: { dayIndex: number; top: number; date: Date } | null;
  previewAppointmentCollisionId: string | null;
  effectiveAppt: (a: AppointmentWithRelations) => { startsAt: Date; durationMinutes: number };
  effectiveBlock: (b: TimeBlock) => { startsAt: Date; endsAt: Date };
  onCellClick: (e: React.MouseEvent<HTMLDivElement>, day: Date) => void;
  onCellMove: (e: React.MouseEvent<HTMLDivElement>, i: number, day: Date) => void;
  onCellLeave: () => void;
  onSelectAppointment: (a: AppointmentWithRelations) => void;
}

function DayColumn({
  day,
  dayIndex,
  isToday,
  appointments,
  blocks,
  hover,
  previewAppointmentCollisionId,
  effectiveAppt,
  effectiveBlock,
  onCellClick,
  onCellMove,
  onCellLeave,
  onSelectAppointment,
}: DayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: buildDayDropId(day) });
  return (
    <div
      ref={setNodeRef}
      onClick={(e) => onCellClick(e, day)}
      onMouseMove={(e) => onCellMove(e, dayIndex, day)}
      onMouseLeave={onCellLeave}
      className={cn(
        "relative cursor-pointer border-b border-l border-border",
        isToday && "bg-primary/3",
        isOver && "bg-primary/5"
      )}
      style={{
        height: GRID_HEIGHT,
        backgroundImage:
          "repeating-linear-gradient(to bottom, var(--border) 0, var(--border) 1px, transparent 1px, transparent " +
          PX_PER_HOUR +
          "px)",
      }}
    >
      {hover?.dayIndex === dayIndex && <HoverGhost top={hover.top} date={hover.date} />}
      {blocks.map((block) => {
        const eff = effectiveBlock(block);
        return (
          <TimeBlockCard
            key={block.id}
            block={block}
            effectiveStartsAt={eff.startsAt}
            effectiveEndsAt={eff.endsAt}
            dense
            hasCollision={previewAppointmentCollisionId === block.id}
          />
        );
      })}
      {appointments.map((appt) => {
        const eff = effectiveAppt(appt);
        return (
          <AppointmentCard
            key={appt.id}
            appointment={appt}
            effectiveStartsAt={eff.startsAt}
            effectiveDuration={eff.durationMinutes}
            dense
            draggable
            hasCollision={previewAppointmentCollisionId === appt.id}
            onClick={() => onSelectAppointment(appt)}
          />
        );
      })}
    </div>
  );
}

function HoverGhost({ top, date }: { top: number; date: Date }) {
  const end = new Date(date.getTime() + GHOST_DURATION_MINUTES * 60_000);
  const height = GHOST_DURATION_MINUTES * PX_PER_MINUTE;
  return (
    <div
      className="pointer-events-none absolute left-1 right-1 flex flex-col justify-start overflow-hidden rounded-md border border-dashed border-primary/50 bg-primary/5 px-2 py-1"
      style={{ top, height: height - 2 }}
    >
      <span className="font-mono text-[10px] font-medium tabular-nums text-primary">
        {formatHM(date)} – {formatHM(end)}
      </span>
    </div>
  );
}
