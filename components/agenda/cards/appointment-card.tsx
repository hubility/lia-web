"use client";

import type { Appointment, CatalogItem, Patient } from "@prisma/client";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { procedureColorVar } from "@/lib/agenda/colors";
import {
  GRID_HEIGHT,
  PX_PER_MINUTE,
  buildDragId,
  minutesFromHourStart,
} from "@/lib/agenda/dnd";

export type AppointmentWithRelations = Appointment & {
  patient: Patient;
  catalogItem: CatalogItem | null;
};

interface Props {
  appointment: AppointmentWithRelations;
  effectiveStartsAt: Date;
  effectiveDuration: number;
  dense: boolean;
  draggable: boolean;
  hasCollision?: boolean;
  onClick: () => void;
}

function formatHM(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AppointmentCard({
  appointment,
  effectiveStartsAt,
  effectiveDuration,
  dense,
  draggable,
  hasCollision,
  onClick,
}: Props) {
  const start = effectiveStartsAt;
  const end = new Date(start.getTime() + effectiveDuration * 60_000);
  const top = minutesFromHourStart(start) * PX_PER_MINUTE;
  const height = effectiveDuration * PX_PER_MINUTE;

  const {
    setNodeRef: setMoveRef,
    listeners: moveListeners,
    attributes: moveAttributes,
    transform: moveTransform,
    isDragging: isMoving,
  } = useDraggable({
    id: buildDragId({ kind: "appointment", id: appointment.id, action: "move" }),
    disabled: !draggable,
  });

  const {
    setNodeRef: setResizeRef,
    listeners: resizeListeners,
    attributes: resizeAttributes,
    isDragging: isResizing,
  } = useDraggable({
    id: buildDragId({ kind: "appointment", id: appointment.id, action: "resize" }),
    disabled: !draggable,
  });

  if (top + height < 0 || top > GRID_HEIGHT) return null;

  const color = procedureColorVar(appointment.catalogItemId ?? appointment.title);
  const isCancelled = appointment.status === "cancelled";
  const isCompleted = appointment.status === "completed";
  const isConfirmed = appointment.status === "confirmed";
  const isDragging = isMoving || isResizing;
  const transform = isMoving ? CSS.Translate.toString(moveTransform) : undefined;

  const minHeight = dense ? 26 : 36;
  const heightOffset = dense ? 2 : 4;

  return (
    <div
      ref={setMoveRef}
      style={{
        top,
        height: Math.max(height - heightOffset, minHeight),
        borderLeftWidth: 3,
        borderLeftColor: color,
        transform,
        zIndex: isDragging ? 30 : undefined,
      }}
      className={cn(
        "absolute flex flex-col overflow-hidden rounded-md border bg-card text-left shadow-sm transition-shadow",
        dense ? "left-1 right-1 px-2 py-1 text-xs" : "left-2 right-2 gap-0.5 px-3 py-2",
        hasCollision ? "border-destructive ring-2 ring-destructive/40" : "border-border/60",
        isCancelled && "opacity-50",
        draggable && "touch-none",
        isDragging ? "cursor-grabbing shadow-lg" : "hover:shadow-md"
      )}
      {...(draggable ? moveListeners : {})}
      {...(draggable ? moveAttributes : {})}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!isDragging) onClick();
        }}
        className={cn(
          "flex flex-1 flex-col text-left",
          dense ? "gap-0" : "gap-0.5",
          draggable && "cursor-grab active:cursor-grabbing"
        )}
        tabIndex={-1}
      >
        <div className={cn("flex items-center justify-between gap-1", dense ? "leading-tight" : "gap-2")}>
          <span
            className={cn(
              "font-mono font-medium tabular-nums text-muted-foreground",
              dense ? "text-[10px]" : "text-xs"
            )}
          >
            {formatHM(start)} – {formatHM(end)}
            {dense && effectiveDuration !== 60 && <span className="ml-1">· {effectiveDuration}min</span>}
            {!dense && <span className="ml-1">· {effectiveDuration}min</span>}
          </span>
          {isConfirmed && (
            <HugeiconsIcon
              icon={Tick02Icon}
              size={dense ? 12 : 14}
              strokeWidth={2.5}
              className="text-success"
            />
          )}
          {isCompleted && (
            <HugeiconsIcon
              icon={Tick02Icon}
              size={dense ? 12 : 14}
              strokeWidth={2.5}
              className="text-muted-foreground"
            />
          )}
        </div>
        <div
          className={cn(
            "truncate font-medium text-foreground",
            dense ? "text-xs leading-tight" : "text-base",
            isCancelled && "line-through"
          )}
        >
          {appointment.patient.name}
        </div>
        {dense
          ? height >= 72 && (
              <div className="truncate text-[11px] leading-tight text-muted-foreground">
                {appointment.title}
              </div>
            )
          : (
              <div className="truncate text-sm text-muted-foreground">{appointment.title}</div>
            )}
      </button>

      {draggable && (
        <div
          ref={setResizeRef}
          {...resizeListeners}
          {...resizeAttributes}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize touch-none",
            isResizing && "bg-primary/40"
          )}
          aria-label="Redimensionar duração"
        />
      )}
    </div>
  );
}
