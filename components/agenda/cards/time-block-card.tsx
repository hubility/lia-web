"use client";

import type { TimeBlock } from "@prisma/client";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import {
  buildDragId,
} from "@/lib/agenda/dnd";
import { type ClinicSchedule, minutesFromScheduleStart } from "@/lib/agenda/schedule";

interface Props {
  block: TimeBlock;
  effectiveStartsAt: Date;
  effectiveEndsAt: Date;
  gridHeight: number;
  pixelsPerMinute: number;
  schedule: ClinicSchedule;
  dense: boolean;
  hasCollision?: boolean;
}

function formatHM(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TimeBlockCard({
  block,
  effectiveStartsAt,
  effectiveEndsAt,
  gridHeight,
  pixelsPerMinute,
  schedule,
  dense,
  hasCollision,
}: Props) {
  const top = minutesFromScheduleStart(effectiveStartsAt, schedule) * pixelsPerMinute;
  const minutes = (effectiveEndsAt.getTime() - effectiveStartsAt.getTime()) / 60_000;
  const height = minutes * pixelsPerMinute;
  if (top + height <= 0 || top >= gridHeight) return null;
  const visibleTop = Math.max(0, top);
  const visibleHeight = Math.min(gridHeight, top + height) - visibleTop;
  const cardHeight = Math.min(
    Math.max(visibleHeight - 2, dense ? 28 : 32),
    gridHeight - visibleTop
  );
  const singleLine = cardHeight < 44;

  if (block.kind === "lunch") {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "absolute flex items-center overflow-hidden rounded-md border border-dashed border-border bg-muted/55 text-muted-foreground",
          dense ? "left-0.5 right-0.5 gap-1.5 px-2 text-xs" : "left-1 right-1 gap-2 px-3"
        )}
        style={{
          top: visibleTop,
          height: cardHeight,
        }}
      >
        <span
          className={cn(
            "shrink-0 font-mono tabular-nums text-muted-foreground/70",
            dense ? "text-[10px]" : "text-xs"
          )}
        >
          {singleLine ? formatHM(effectiveStartsAt) : `${formatHM(effectiveStartsAt)} – ${formatHM(effectiveEndsAt)}`}
        </span>
        <span className="truncate text-sm">{block.label}</span>
      </div>
    );
  }

  return <DraggableBlock {...{ block, effectiveStartsAt, effectiveEndsAt, gridHeight, pixelsPerMinute, schedule, dense, hasCollision, top: visibleTop, height: visibleHeight }} />;
}

function DraggableBlock({
  block,
  effectiveStartsAt,
  effectiveEndsAt,
  dense,
  hasCollision,
  top,
  height,
}: Props & { top: number; height: number }) {
  const {
    setNodeRef: setMoveRef,
    listeners: moveListeners,
    attributes: moveAttributes,
    transform: moveTransform,
    isDragging: isMoving,
  } = useDraggable({
    id: buildDragId({ kind: "timeblock", id: block.id, action: "move" }),
  });
  const {
    setNodeRef: setResizeRef,
    listeners: resizeListeners,
    attributes: resizeAttributes,
    isDragging: isResizing,
  } = useDraggable({
    id: buildDragId({ kind: "timeblock", id: block.id, action: "resize" }),
  });

  const isDragging = isMoving || isResizing;
  const transform = isMoving ? CSS.Translate.toString(moveTransform) : undefined;

  return (
    <div
      ref={setMoveRef}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "absolute flex flex-col justify-center gap-0.5 overflow-hidden rounded-md border bg-primary/8 touch-none",
        dense ? "left-0.5 right-0.5 px-2 py-1 text-xs" : "left-1 right-1 px-3 py-1.5",
        hasCollision ? "border-destructive ring-2 ring-destructive/40" : "border-primary/30",
        isDragging ? "cursor-grabbing shadow-lg" : "cursor-grab"
      )}
      style={{
        top,
        height: Math.max(height - 2, dense ? 28 : 32),
        transform,
        zIndex: isDragging ? 30 : undefined,
      }}
      {...moveListeners}
      {...moveAttributes}
    >
      <span
        className={cn(
          "font-mono font-medium tabular-nums text-primary",
          dense ? "text-[10px]" : "text-xs"
        )}
      >
        {formatHM(effectiveStartsAt)} – {formatHM(effectiveEndsAt)} · bloqueio
      </span>
      <span className={cn("truncate font-medium text-foreground", dense ? "text-sm" : "text-sm")}>
        {block.label}
      </span>
      {block.notes && (dense ? height >= 56 : true) && (
        <span className={cn("truncate text-muted-foreground", dense ? "text-[11px]" : "text-xs")}>
          {block.notes}
        </span>
      )}

      <div
        ref={setResizeRef}
        {...resizeListeners}
        {...resizeAttributes}
        className={cn(
          "absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize touch-none",
          isResizing && "bg-primary/40"
        )}
        aria-label="Redimensionar bloqueio"
      />
    </div>
  );
}
