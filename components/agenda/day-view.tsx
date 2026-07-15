"use client";

import { useEffect, useState } from "react";
import type { CatalogItem, Patient, TimeBlock } from "@prisma/client";
import { DndContext, useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { isSameDay } from "@/lib/agenda/range";
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

const DAY_FULL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const GHOST_DURATION_MINUTES = 60;

interface DayViewProps {
  date: Date;
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

export function DayView({
  date,
  appointments,
  timeBlocks,
  patients,
  catalog,
  schedule,
}: DayViewProps) {
  const today = new Date();
  const isToday = isSameDay(date, today);
  const [selected, setSelected] = useState<AppointmentWithRelations | null>(null);
  const [createAt, setCreateAt] = useState<Date | null>(null);
  const [hover, setHover] = useState<{ top: number; date: Date } | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const durationMinutes = scheduleDurationMinutes(schedule);
  const ticks = buildScheduleTicks(schedule);
  const { timelineRef, gridHeight, pixelsPerMinute } = useTimelineMetrics(durationMinutes);

  const { sensors, preview, effectiveAppt, effectiveBlock, handleDragMove, handleDragEnd } =
    useAgendaDnd({
      appointments,
      timeBlocks,
      defaultDay: date,
      pixelsPerMinute,
      schedule,
    });

  useEffect(() => {
    const initialTimer = window.setTimeout(() => setNow(new Date()), 0);
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, []);

  function handleCellClick(e: React.MouseEvent<HTMLDivElement>) {
    if (preview) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    setCreateAt(snapTimeFromOffset(date, offsetY, pixelsPerMinute, schedule).date);
  }

  function handleCellMove(e: React.MouseEvent<HTMLDivElement>) {
    if (preview || e.target !== e.currentTarget) {
      setHover(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const { date: snapDate, snappedMinutes } = snapTimeFromOffset(
      date,
      offsetY,
      pixelsPerMinute,
      schedule
    );
    setHover({ top: snappedMinutes * pixelsPerMinute, date: snapDate });
  }

  const previewCollisionId = preview && preview.collision ? preview.id : null;
  const nowMinutes = now && isToday ? minutesFromScheduleStart(now, schedule) : null;
  const currentTimeTop =
    nowMinutes !== null && nowMinutes >= 0 && nowMinutes <= durationMinutes
      ? nowMinutes * pixelsPerMinute
      : null;

  return (
    <DndContext
      id="agenda-day-dnd"
      sensors={sensors}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full">
        <div className="scrollbar-slim h-full overflow-auto">
          <div className="flex min-h-full flex-col">
            <div
              className={cn(
                "sticky top-0 z-20 flex items-baseline gap-3 border-y border-border bg-background px-4 py-2.5",
                isToday && "bg-primary/3"
              )}
            >
              <span
                className={cn(
                  "font-mono text-3xl font-light leading-none tabular-nums",
                  isToday ? "text-primary" : "text-foreground"
                )}
              >
                {date.getDate()}
              </span>
              <span className="font-mono text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {DAY_FULL[date.getDay()]}
              </span>
              <span
                className={cn(
                  "ml-auto font-mono text-xs",
                  appointments.length > 0 ? "text-foreground" : "text-muted-foreground/65"
                )}
              >
                {appointments.length} {appointments.length === 1 ? "consulta" : "consultas"}
              </span>
            </div>

            <div
              ref={timelineRef}
              className="relative grid flex-1 grid-cols-[clamp(3.5rem,8vw,4.5rem)_1fr]"
              style={{ minHeight: (durationMinutes / 60) * 56 }}
            >
          <div className="sticky left-0 z-10 border-b border-border bg-background">
            {ticks.map((tick, i) => (
              <div
                key={`${tick.offsetMinutes}-${tick.label}`}
                className={cn(
                  "absolute right-3 font-mono text-xs tabular-nums text-muted-foreground",
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
            ))}
          </div>

          <DayDroppable
            date={date}
            hover={hover}
            previewCollisionId={previewCollisionId}
            gridHeight={gridHeight}
            pixelsPerMinute={pixelsPerMinute}
            schedule={schedule}
            ticks={ticks}
            currentTimeTop={currentTimeTop}
            appointments={appointments}
            timeBlocks={timeBlocks}
            effectiveAppt={effectiveAppt}
            effectiveBlock={effectiveBlock}
            onCellClick={handleCellClick}
            onCellMove={handleCellMove}
            onCellLeave={() => setHover(null)}
            onSelectAppointment={setSelected}
          />
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

interface DayDroppableProps {
  date: Date;
  hover: { top: number; date: Date } | null;
  previewCollisionId: string | null;
  appointments: AppointmentWithRelations[];
  timeBlocks: TimeBlock[];
  gridHeight: number;
  pixelsPerMinute: number;
  schedule: ClinicSchedule;
  ticks: ScheduleTick[];
  currentTimeTop: number | null;
  effectiveAppt: (a: AppointmentWithRelations) => { startsAt: Date; durationMinutes: number };
  effectiveBlock: (b: TimeBlock) => { startsAt: Date; endsAt: Date };
  onCellClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onCellMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onCellLeave: () => void;
  onSelectAppointment: (a: AppointmentWithRelations) => void;
}

function DayDroppable({
  date,
  hover,
  previewCollisionId,
  appointments,
  timeBlocks,
  gridHeight,
  pixelsPerMinute,
  schedule,
  ticks,
  currentTimeTop,
  effectiveAppt,
  effectiveBlock,
  onCellClick,
  onCellMove,
  onCellLeave,
  onSelectAppointment,
}: DayDroppableProps) {
  const { setNodeRef, isOver } = useDroppable({ id: buildDayDropId(date) });
  return (
    <div
      ref={setNodeRef}
      onClick={onCellClick}
      onMouseMove={onCellMove}
      onMouseLeave={onCellLeave}
      className={cn(
        "relative cursor-pointer border-b border-l border-border",
        isOver && "bg-primary/5"
      )}
    >
      <TimelineGrid ticks={ticks} pixelsPerMinute={pixelsPerMinute} />
      {currentTimeTop !== null && <CurrentTimeLine top={currentTimeTop} />}
      {hover && (
        <DayHoverGhost top={hover.top} date={hover.date} pixelsPerMinute={pixelsPerMinute} />
      )}
      {timeBlocks.map((block) => {
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
            dense={false}
            hasCollision={previewCollisionId === block.id}
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
            dense={false}
            draggable
            hasCollision={previewCollisionId === appt.id}
            onClick={() => onSelectAppointment(appt)}
          />
        );
      })}
    </div>
  );
}

function DayHoverGhost({
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
      className="pointer-events-none absolute left-2 right-2 flex flex-col justify-start overflow-hidden rounded-md border border-dashed border-primary/50 bg-primary/5 px-3 py-1.5"
      style={{ top, height: height - 2 }}
    >
      <span className="font-mono text-xs font-medium tabular-nums text-primary">
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
