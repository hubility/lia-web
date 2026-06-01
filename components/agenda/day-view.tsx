"use client";

import { useState } from "react";
import type { CatalogItem, Patient, TimeBlock } from "@/app/generated/prisma/client";
import { DndContext, useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { isSameDay } from "@/lib/agenda/range";
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

const DAY_FULL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const GHOST_DURATION_MINUTES = 60;

interface DayViewProps {
  date: Date;
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

export function DayView({ date, appointments, timeBlocks, patients, catalog }: DayViewProps) {
  const today = new Date();
  const isToday = isSameDay(date, today);
  const [selected, setSelected] = useState<AppointmentWithRelations | null>(null);
  const [createAt, setCreateAt] = useState<Date | null>(null);
  const [hover, setHover] = useState<{ top: number; date: Date } | null>(null);

  const { sensors, preview, effectiveAppt, effectiveBlock, handleDragMove, handleDragEnd } =
    useAgendaDnd({ appointments, timeBlocks, defaultDay: date });

  function handleCellClick(e: React.MouseEvent<HTMLDivElement>) {
    if (preview) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    setCreateAt(snapTimeFromOffset(date, offsetY).date);
  }

  function handleCellMove(e: React.MouseEvent<HTMLDivElement>) {
    if (preview || e.target !== e.currentTarget) {
      setHover(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const { date: snapDate, snappedMinutes } = snapTimeFromOffset(date, offsetY);
    setHover({ top: (snappedMinutes / 60) * PX_PER_HOUR, date: snapDate });
  }

  const previewCollisionId = preview && preview.collision ? preview.id : null;

  return (
    <DndContext sensors={sensors} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
      <div>
        <div className={cn("border-y border-border px-4 py-3", isToday && "bg-primary/3")}>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-3xl font-light tabular-nums text-foreground">
              {date.getDate()}
            </span>
            <span className="font-mono text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {DAY_FULL[date.getDay()]}
            </span>
            {isToday && (
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                · hoje
              </span>
            )}
            <span className="ml-auto font-mono text-xs text-muted-foreground">
              {appointments.length} {appointments.length === 1 ? "consulta" : "consultas"}
            </span>
          </div>
        </div>

        <div className="relative grid grid-cols-[72px_1fr]">
          <div className="relative" style={{ height: GRID_HEIGHT }}>
            {Array.from({ length: HOURS + 1 }, (_, i) => (
              <div
                key={i}
                className="absolute right-3 -translate-y-1/2 font-mono text-xs text-muted-foreground tabular-nums"
                style={{ top: i * PX_PER_HOUR }}
              >
                {String(HOUR_START + i).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          <DayDroppable
            date={date}
            hover={hover}
            previewCollisionId={previewCollisionId}
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
      style={{
        height: GRID_HEIGHT,
        backgroundImage:
          "repeating-linear-gradient(to bottom, var(--border) 0, var(--border) 1px, transparent 1px, transparent " +
          PX_PER_HOUR +
          "px)",
      }}
    >
      {hover && <DayHoverGhost top={hover.top} date={hover.date} />}
      {timeBlocks.map((block) => {
        const eff = effectiveBlock(block);
        return (
          <TimeBlockCard
            key={block.id}
            block={block}
            effectiveStartsAt={eff.startsAt}
            effectiveEndsAt={eff.endsAt}
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

function DayHoverGhost({ top, date }: { top: number; date: Date }) {
  const end = new Date(date.getTime() + GHOST_DURATION_MINUTES * 60_000);
  const height = GHOST_DURATION_MINUTES * PX_PER_MINUTE;
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
