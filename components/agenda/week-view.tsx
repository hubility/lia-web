"use client";

import { useEffect, useState } from "react";
import type { CatalogItem, Patient, TimeBlock } from "@prisma/client";
import { DndContext, useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { isSameDay, weekDays } from "@/lib/agenda/range";
import {
  SNAP_MINUTES,
  buildDayDropId,
} from "@/lib/agenda/dnd";
import {
  type ClinicSchedule,
  type ScheduleTick,
  applyMinutesToScheduleDay,
  buildScheduleTicks,
  clampScheduleOffset,
  minutesFromScheduleStart,
  scheduleDurationMinutes,
} from "@/lib/agenda/schedule";
import { AppointmentSheet } from "@/components/agenda/appointment-sheet";
import {
  AppointmentCard,
  type AppointmentWithRelations,
} from "@/components/agenda/cards/appointment-card";
import { TimeBlockCard } from "@/components/agenda/cards/time-block-card";
import { useAgendaDnd } from "@/components/agenda/use-agenda-dnd";
import { useTimelineMetrics } from "@/components/agenda/use-timeline-metrics";

const DAY_LABELS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const GHOST_DURATION_MINUTES = 60;

interface WeekViewProps {
  weekStart: Date;
  appointments: AppointmentWithRelations[];
  timeBlocks: TimeBlock[];
  patients: Patient[];
  catalog: CatalogItem[];
  schedule: ClinicSchedule;
}

function snapTimeFromOffset(
  day: Date,
  offsetY: number,
  pixelsPerMinute: number,
  schedule: ClinicSchedule
): { date: Date; snappedMinutes: number } {
  const rawMinutes = offsetY / pixelsPerMinute;
  const rawSnapped = Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES;
  const snappedMinutes = clampScheduleOffset(
    rawSnapped,
    GHOST_DURATION_MINUTES,
    schedule
  );
  return {
    date: applyMinutesToScheduleDay(day, snappedMinutes, schedule),
    snappedMinutes,
  };
}

function formatHM(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function WeekView({
  weekStart,
  appointments,
  timeBlocks,
  patients,
  catalog,
  schedule,
}: WeekViewProps) {
  const days = weekDays(weekStart);
  const today = new Date();
  const [selected, setSelected] = useState<AppointmentWithRelations | null>(null);
  const [createAt, setCreateAt] = useState<Date | null>(null);
  const [hover, setHover] = useState<{ dayIndex: number; top: number; date: Date } | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const durationMinutes = scheduleDurationMinutes(schedule);
  const ticks = buildScheduleTicks(schedule);
  const { timelineRef, gridHeight, pixelsPerMinute } = useTimelineMetrics(durationMinutes);

  const { sensors, preview, effectiveAppt, effectiveBlock, handleDragMove, handleDragEnd } =
    useAgendaDnd({ appointments, timeBlocks, pixelsPerMinute, schedule });

  useEffect(() => {
    const initialTimer = window.setTimeout(() => setNow(new Date()), 0);
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, []);

  function handleCellClick(e: React.MouseEvent<HTMLDivElement>, day: Date) {
    if (preview) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    setCreateAt(snapTimeFromOffset(day, offsetY, pixelsPerMinute, schedule).date);
  }

  function handleCellMove(e: React.MouseEvent<HTMLDivElement>, dayIndex: number, day: Date) {
    if (preview || e.target !== e.currentTarget) {
      setHover(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const { date, snappedMinutes } = snapTimeFromOffset(
      day,
      offsetY,
      pixelsPerMinute,
      schedule
    );
    setHover({ dayIndex, top: snappedMinutes * pixelsPerMinute, date });
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
    <DndContext
      id="agenda-week-dnd"
      sensors={sensors}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full">
        <div className="scrollbar-slim h-full overflow-auto">
          <div className="flex min-h-full min-w-[calc(3.5rem+6*8.5rem)] flex-col">
            <div className="sticky top-0 z-20 grid grid-cols-[56px_repeat(6,minmax(8.5rem,1fr))] bg-background">
              <div className="sticky left-0 z-30 border-y border-border bg-background" aria-hidden="true" />
              {days.map((day, i) => {
                const isToday = isSameDay(day, today);
                const count = apptByDay[i].length;
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "flex flex-col border-y border-l border-border px-3 py-2.5 last:border-r",
                      isToday && "bg-primary/3"
                    )}
                  >
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {DAY_LABELS[i]}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 font-mono text-2xl font-light leading-none tabular-nums",
                        isToday ? "text-primary" : "text-foreground"
                      )}
                    >
                      {day.getDate()}
                    </span>
                    <span
                      className={cn(
                        "mt-1.5 font-mono text-[11px]",
                        count > 0 ? "text-foreground" : "text-muted-foreground/65"
                      )}
                    >
                      {count} {count === 1 ? "consulta" : "consultas"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div
              ref={timelineRef}
              className="relative grid flex-1 grid-cols-[56px_repeat(6,minmax(8.5rem,1fr))]"
              style={{ minHeight: (durationMinutes / 60) * 56 }}
            >
              <div className="sticky left-0 z-10 border-b border-border bg-background">
                {ticks.map((tick, i) => {
                  return (
                    <div
                      key={`${tick.offsetMinutes}-${tick.label}`}
                      className={cn(
                        "absolute right-2 font-mono text-[11px] tabular-nums text-muted-foreground",
                        i === 0
                          ? "translate-y-1"
                          : i === ticks.length - 1
                            ? "-translate-y-full -mt-1"
                            : "-translate-y-1/2"
                      )}
                      style={{ top: tick.offsetMinutes * pixelsPerMinute }}
                    >
                      {tick.label}
                    </div>
                  );
                })}
              </div>

              {days.map((day, i) => {
                const isToday = isSameDay(day, today);
                const nowMinutes = now && isToday
                  ? minutesFromScheduleStart(now, schedule)
                  : null;
                const currentTimeTop =
                  nowMinutes !== null && nowMinutes >= 0 && nowMinutes <= durationMinutes
                    ? nowMinutes * pixelsPerMinute
                    : null;
                return (
                  <DayColumn
                    key={day.toISOString()}
                    day={day}
                    dayIndex={i}
                    isToday={isToday}
                    appointments={apptByDay[i]}
                    blocks={blocksByDay[i]}
                    hover={hover}
                    gridHeight={gridHeight}
                    pixelsPerMinute={pixelsPerMinute}
                    schedule={schedule}
                    ticks={ticks}
                    currentTimeTop={currentTimeTop}
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
                );
              })}
            </div>
          </div>
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
  gridHeight: number;
  pixelsPerMinute: number;
  schedule: ClinicSchedule;
  ticks: ScheduleTick[];
  currentTimeTop: number | null;
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
  gridHeight,
  pixelsPerMinute,
  schedule,
  ticks,
  currentTimeTop,
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
        "relative cursor-pointer border-b border-l border-border last:border-r",
        isToday && "bg-primary/3",
        isOver && "bg-primary/5"
      )}
    >
      <TimelineGrid ticks={ticks} pixelsPerMinute={pixelsPerMinute} />
      {currentTimeTop !== null && <CurrentTimeLine top={currentTimeTop} />}
      {hover?.dayIndex === dayIndex && (
        <HoverGhost top={hover.top} date={hover.date} pixelsPerMinute={pixelsPerMinute} />
      )}
      {blocks.map((block) => {
        const eff = effectiveBlock(block);
        return (
          <TimeBlockCard
            key={block.id}
            block={block}
            effectiveStartsAt={eff.startsAt}
            effectiveEndsAt={eff.endsAt}
            gridHeight={gridHeight}
            pixelsPerMinute={pixelsPerMinute}
            schedule={schedule}
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
            gridHeight={gridHeight}
            pixelsPerMinute={pixelsPerMinute}
            schedule={schedule}
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

function HoverGhost({
  top,
  date,
  pixelsPerMinute,
}: {
  top: number;
  date: Date;
  pixelsPerMinute: number;
}) {
  const end = new Date(date.getTime() + GHOST_DURATION_MINUTES * 60_000);
  const height = GHOST_DURATION_MINUTES * pixelsPerMinute;
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

function TimelineGrid({
  ticks,
  pixelsPerMinute,
}: {
  ticks: ScheduleTick[];
  pixelsPerMinute: number;
}) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {ticks.slice(0, -1).map((tick) => (
        <span
          key={`${tick.offsetMinutes}-${tick.label}`}
          className="absolute inset-x-0 border-t border-border"
          style={{ top: tick.offsetMinutes * pixelsPerMinute }}
        />
      ))}
    </div>
  );
}

function CurrentTimeLine({ top }: { top: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 z-20 border-t border-primary/80"
      style={{ top }}
    >
      <span className="absolute -left-0.5 -top-1 block size-2 rounded-full bg-primary" />
    </div>
  );
}
