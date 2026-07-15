"use client";

import type { Appointment, CatalogItem, Patient } from "@prisma/client";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { procedureColorVar } from "@/lib/agenda/colors";
import {
  buildDragId,
} from "@/lib/agenda/dnd";
import { type ClinicSchedule, minutesFromScheduleStart } from "@/lib/agenda/schedule";

export type AppointmentWithRelations = Appointment & {
  patient: Patient;
  catalogItem: CatalogItem | null;
};

interface Props {
  appointment: AppointmentWithRelations;
  effectiveStartsAt: Date;
  effectiveDuration: number;
  gridHeight: number;
  pixelsPerMinute: number;
  schedule: ClinicSchedule;
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
  gridHeight,
  pixelsPerMinute,
  schedule,
  dense,
  draggable,
  hasCollision,
  onClick,
}: Props) {
  const start = effectiveStartsAt;
  const end = new Date(start.getTime() + effectiveDuration * 60_000);
  const top = minutesFromScheduleStart(start, schedule) * pixelsPerMinute;
  const height = effectiveDuration * pixelsPerMinute;

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

  if (top + height <= 0 || top >= gridHeight) return null;
  const visibleTop = Math.max(0, top);
  const visibleHeight = Math.min(gridHeight, top + height) - visibleTop;

  const color = procedureColorVar(appointment.catalogItemId ?? appointment.title);
  const isCancelled = appointment.status === "cancelled";
  const isCompleted = appointment.status === "completed";
  const isConfirmed = appointment.status === "confirmed";
  const isDragging = isMoving || isResizing;
  const transform = isMoving ? CSS.Translate.toString(moveTransform) : undefined;

  const cardHeight = Math.min(
    Math.max(visibleHeight - 2, dense ? 28 : 32),
    gridHeight - visibleTop
  );
  const singleLine = cardHeight < 44;
  const showTitle = cardHeight >= (dense ? 68 : 76);
  const statusIcon = isConfirmed || isCompleted;

  return (
    <div
      ref={setMoveRef}
      style={{
        top: visibleTop,
        height: cardHeight,
        borderColor: hasCollision
          ? "var(--destructive)"
          : `color-mix(in srgb, ${color} 45%, var(--border))`,
        backgroundColor: `color-mix(in srgb, ${color} 7%, var(--card))`,
        transform,
        zIndex: isDragging ? 30 : undefined,
      }}
      className={cn(
        "absolute flex overflow-hidden rounded-md border text-left shadow-sm transition-[box-shadow,opacity]",
        dense ? "left-1 right-1 text-xs" : "left-2 right-2",
        hasCollision && "ring-2 ring-destructive/40",
        isCancelled && "opacity-50",
        isDragging ? "cursor-grabbing shadow-lg" : "hover:shadow-md"
      )}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!isDragging) onClick();
        }}
        aria-label={`${formatHM(start)}, ${appointment.patient.name}, ${appointment.title}, ${effectiveDuration} minutos`}
        className={cn(
          "flex h-full min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          singleLine
            ? "items-center gap-2 px-2"
            : "flex-col justify-center gap-0.5 px-2.5 py-1",
          draggable && "touch-none cursor-grab active:cursor-grabbing"
        )}
        {...(draggable ? moveListeners : {})}
        {...(draggable ? moveAttributes : {})}
      >
        {singleLine ? (
          <>
            <span className="shrink-0 font-mono text-[10px] font-medium tabular-nums text-muted-foreground">
              {formatHM(start)}
            </span>
            <span
              className={cn(
                "min-w-0 truncate font-medium text-foreground",
                dense ? "text-xs" : "text-sm",
                dense ? "flex-1" : "max-w-[45%] shrink-0",
                isCancelled && "line-through"
              )}
            >
              {appointment.patient.name}
            </span>
            {!dense && (
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                {appointment.title}
              </span>
            )}
            {statusIcon && (
              <HugeiconsIcon
                icon={Tick02Icon}
                size={12}
                strokeWidth={2.5}
                className={cn("shrink-0", isConfirmed ? "text-success" : "text-muted-foreground")}
              />
            )}
          </>
        ) : (
          <>
            <div className="flex w-full min-w-0 items-center gap-2">
              <span
                className={cn(
                  "min-w-0 flex-1 truncate font-medium text-foreground",
                  dense ? "text-xs leading-tight" : "text-sm leading-tight",
                  isCancelled && "line-through"
                )}
              >
                {appointment.patient.name}
              </span>
              {statusIcon && (
                <HugeiconsIcon
                  icon={Tick02Icon}
                  size={dense ? 12 : 14}
                  strokeWidth={2.5}
                  className={cn(
                    "shrink-0",
                    isConfirmed ? "text-success" : "text-muted-foreground"
                  )}
                />
              )}
            </div>
            <span
              className={cn(
                "w-full truncate font-mono font-medium tabular-nums text-muted-foreground",
                dense ? "text-[10px] leading-tight" : "text-xs leading-tight"
              )}
            >
              {formatHM(start)} – {formatHM(end)}
            </span>
            {showTitle && (
              <span
                className={cn(
                  "w-full truncate text-muted-foreground",
                  dense ? "text-[11px] leading-tight" : "text-xs"
                )}
              >
                {appointment.title}
              </span>
            )}
          </>
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
