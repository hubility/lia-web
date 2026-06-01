"use client";

import type { TimeBlock } from "@/app/generated/prisma/client";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import {
  GRID_HEIGHT,
  PX_PER_MINUTE,
  buildDragId,
  minutesFromHourStart,
} from "@/lib/agenda/dnd";

interface Props {
  block: TimeBlock;
  effectiveStartsAt: Date;
  effectiveEndsAt: Date;
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
  dense,
  hasCollision,
}: Props) {
  const top = minutesFromHourStart(effectiveStartsAt) * PX_PER_MINUTE;
  const minutes = (effectiveEndsAt.getTime() - effectiveStartsAt.getTime()) / 60_000;
  const height = minutes * PX_PER_MINUTE;

  if (top + height < 0 || top > GRID_HEIGHT) return null;

  if (block.kind === "lunch") {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "absolute flex flex-col justify-center overflow-hidden rounded-md border border-border/40 italic text-muted-foreground",
          dense ? "left-0.5 right-0.5 px-2.5 text-xs" : "left-1 right-1 px-3"
        )}
        style={{
          top,
          height: Math.max(height - (dense ? 2 : 4), dense ? 24 : 32),
          backgroundImage:
            "repeating-linear-gradient(135deg, transparent 0, transparent 6px, var(--border) 6px, var(--border) 7px)",
        }}
      >
        <span
          className={cn(
            "font-mono not-italic tabular-nums text-muted-foreground/70",
            dense ? "text-[10px]" : "text-xs"
          )}
        >
          {formatHM(effectiveStartsAt)} – {formatHM(effectiveEndsAt)}
        </span>
        <span className="text-sm">{block.label}</span>
      </div>
    );
  }

  return <DraggableBlock {...{ block, effectiveStartsAt, effectiveEndsAt, dense, hasCollision, top, height, minutes }} />;
}

function DraggableBlock({
  block,
  effectiveStartsAt,
  effectiveEndsAt,
  dense,
  hasCollision,
  top,
  height,
}: Props & { top: number; height: number; minutes: number }) {
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
        "absolute flex flex-col gap-0.5 overflow-hidden rounded-md border bg-primary/10 touch-none",
        dense ? "left-0.5 right-0.5 px-2.5 py-1.5 text-xs" : "left-1 right-1 px-3 py-2",
        hasCollision ? "border-destructive ring-2 ring-destructive/40" : "border-primary/30",
        isDragging ? "cursor-grabbing shadow-lg" : "cursor-grab"
      )}
      style={{
        top,
        height: Math.max(height - (dense ? 2 : 4), dense ? 28 : 36),
        borderLeftWidth: 3,
        borderLeftColor: "var(--primary)",
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
