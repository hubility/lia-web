"use client";

import { useState } from "react";
import {
  type DragEndEvent,
  type DragMoveEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { TimeBlock } from "@prisma/client";
import { toast } from "sonner";
import {
  moveAppointmentAction,
  moveTimeBlockAction,
} from "@/app/(dashboard)/agenda/actions";
import {
  MIN_DURATION_MINUTES,
  type DragId,
  parseDayDropId,
  parseDragId,
  snapMinutes,
} from "@/lib/agenda/dnd";
import {
  type ClinicSchedule,
  applyMinutesToScheduleDay,
  clampScheduleOffset,
  minutesFromScheduleStart,
  scheduleDurationMinutes,
} from "@/lib/agenda/schedule";
import { type CollisionTarget, findCollision } from "@/lib/agenda/collision";
import type { AppointmentWithRelations } from "./cards/appointment-card";

export type AppointmentOverride = { startsAt: Date; durationMinutes: number };
export type TimeBlockOverride = { startsAt: Date; endsAt: Date };

export type DragPreview = {
  dragId: string;
  kind: DragId["kind"];
  id: string;
  action: DragId["action"];
  candidate: { startsAt: Date; durationMinutes: number; endsAt: Date };
  collision: CollisionTarget | null;
};

interface Options {
  appointments: AppointmentWithRelations[];
  timeBlocks: TimeBlock[];
  defaultDay?: Date;
  pixelsPerMinute: number;
  schedule: ClinicSchedule;
}

export function useAgendaDnd({
  appointments,
  timeBlocks,
  defaultDay,
  pixelsPerMinute,
  schedule,
}: Options) {
  const [appointmentOverrides, setAppointmentOverrides] = useState<
    Map<string, AppointmentOverride>
  >(new Map());
  const [timeBlockOverrides, setTimeBlockOverrides] = useState<
    Map<string, TimeBlockOverride>
  >(new Map());
  const [preview, setPreview] = useState<DragPreview | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function effectiveAppt(a: AppointmentWithRelations): AppointmentOverride {
    const o = appointmentOverrides.get(a.id);
    const propStarts = new Date(a.startsAt);
    if (!o) return { startsAt: propStarts, durationMinutes: a.durationMinutes };
    // Ignore stale override once props caught up
    if (
      propStarts.getTime() === o.startsAt.getTime() &&
      a.durationMinutes === o.durationMinutes
    ) {
      return { startsAt: propStarts, durationMinutes: a.durationMinutes };
    }
    return o;
  }

  function effectiveBlock(b: TimeBlock): TimeBlockOverride {
    const o = timeBlockOverrides.get(b.id);
    const propStarts = new Date(b.startsAt);
    const propEnds = new Date(b.endsAt);
    if (!o) return { startsAt: propStarts, endsAt: propEnds };
    if (
      propStarts.getTime() === o.startsAt.getTime() &&
      propEnds.getTime() === o.endsAt.getTime()
    ) {
      return { startsAt: propStarts, endsAt: propEnds };
    }
    return o;
  }

  function computeCandidate(
    drag: DragId,
    deltaY: number,
    overId: string | null
  ): { startsAt: Date; durationMinutes: number; endsAt: Date } | null {
    const minutesDelta = deltaY / pixelsPerMinute;

    if (drag.kind === "appointment") {
      const appt = appointments.find((a) => a.id === drag.id);
      if (!appt) return null;
      const orig = effectiveAppt(appt);
      if (drag.action === "resize") {
        const rawDuration = orig.durationMinutes + minutesDelta;
        const newDuration = Math.max(MIN_DURATION_MINUTES, snapMinutes(rawDuration));
        const maxDuration =
          scheduleDurationMinutes(schedule) - minutesFromScheduleStart(orig.startsAt, schedule);
        const clamped = Math.min(newDuration, maxDuration);
        return {
          startsAt: orig.startsAt,
          durationMinutes: clamped,
          endsAt: new Date(orig.startsAt.getTime() + clamped * 60_000),
        };
      }
      const targetDay =
        (overId && parseDayDropId(overId)) || defaultDay || orig.startsAt;
      const startMinutes = minutesFromScheduleStart(orig.startsAt, schedule);
      const snapped = snapMinutes(startMinutes + minutesDelta);
      const clamped = clampScheduleOffset(snapped, orig.durationMinutes, schedule);
      const newStart = applyMinutesToScheduleDay(targetDay, clamped, schedule);
      return {
        startsAt: newStart,
        durationMinutes: orig.durationMinutes,
        endsAt: new Date(newStart.getTime() + orig.durationMinutes * 60_000),
      };
    }

    const block = timeBlocks.find((b) => b.id === drag.id);
    if (!block) return null;
    if (block.kind === "lunch") return null;
    const orig = effectiveBlock(block);
    const duration = Math.round(
      (orig.endsAt.getTime() - orig.startsAt.getTime()) / 60_000
    );
    if (drag.action === "resize") {
      const rawDuration = duration + minutesDelta;
      const newDuration = Math.max(MIN_DURATION_MINUTES, snapMinutes(rawDuration));
      const maxDuration =
        scheduleDurationMinutes(schedule) - minutesFromScheduleStart(orig.startsAt, schedule);
      const clamped = Math.min(newDuration, maxDuration);
      return {
        startsAt: orig.startsAt,
        durationMinutes: clamped,
        endsAt: new Date(orig.startsAt.getTime() + clamped * 60_000),
      };
    }
    const targetDay =
      (overId && parseDayDropId(overId)) || defaultDay || orig.startsAt;
    const startMinutes = minutesFromScheduleStart(orig.startsAt, schedule);
    const snapped = snapMinutes(startMinutes + minutesDelta);
    const clamped = clampScheduleOffset(snapped, duration, schedule);
    const newStart = applyMinutesToScheduleDay(targetDay, clamped, schedule);
    return {
      startsAt: newStart,
      durationMinutes: duration,
      endsAt: new Date(newStart.getTime() + duration * 60_000),
    };
  }

  function collisionAt(candidate: {
    startsAt: Date;
    durationMinutes: number;
  }, excludeId: string): CollisionTarget | null {
    const appliedAppts = appointments.map((a) => {
      const eff = effectiveAppt(a);
      return {
        id: a.id,
        title: a.title,
        status: a.status,
        startsAt: eff.startsAt,
        durationMinutes: eff.durationMinutes,
      };
    });
    const appliedBlocks = timeBlocks.map((b) => {
      const eff = effectiveBlock(b);
      return {
        id: b.id,
        label: b.label,
        kind: b.kind,
        startsAt: eff.startsAt,
        endsAt: eff.endsAt,
      };
    });
    return findCollision(candidate, appliedAppts, appliedBlocks, excludeId);
  }

  function handleDragMove(e: DragMoveEvent) {
    const drag = parseDragId(String(e.active.id));
    if (!drag) return;
    const candidate = computeCandidate(
      drag,
      e.delta.y,
      e.over?.id ? String(e.over.id) : null
    );
    if (!candidate) return;
    const collision = collisionAt(candidate, drag.id);
    setPreview({
      dragId: String(e.active.id),
      kind: drag.kind,
      id: drag.id,
      action: drag.action,
      candidate,
      collision,
    });
  }

  async function handleDragEnd(e: DragEndEvent) {
    const drag = parseDragId(String(e.active.id));
    setPreview(null);
    if (!drag) return;
    const candidate = computeCandidate(
      drag,
      e.delta.y,
      e.over?.id ? String(e.over.id) : null
    );
    if (!candidate) return;
    const collision = collisionAt(candidate, drag.id);
    if (collision) {
      const label =
        collision.kind === "appointment"
          ? collision.label
          : `bloqueio: ${collision.label}`;
      toast.error(`Choca com ${label}`);
      return;
    }

    if (drag.kind === "appointment") {
      const appt = appointments.find((a) => a.id === drag.id);
      if (!appt) return;
      const orig = effectiveAppt(appt);
      if (
        orig.startsAt.getTime() === candidate.startsAt.getTime() &&
        orig.durationMinutes === candidate.durationMinutes
      ) {
        return;
      }
      setAppointmentOverrides((prev) => {
        const next = new Map(prev);
        next.set(drag.id, {
          startsAt: candidate.startsAt,
          durationMinutes: candidate.durationMinutes,
        });
        return next;
      });
      const result = await moveAppointmentAction(
        drag.id,
        candidate.startsAt.toISOString(),
        candidate.durationMinutes
      );
      if (!result.ok) {
        toast.error(result.error);
        setAppointmentOverrides((prev) => {
          const next = new Map(prev);
          next.delete(drag.id);
          return next;
        });
      }
    } else {
      const block = timeBlocks.find((b) => b.id === drag.id);
      if (!block || block.kind === "lunch") return;
      const orig = effectiveBlock(block);
      if (
        orig.startsAt.getTime() === candidate.startsAt.getTime() &&
        orig.endsAt.getTime() === candidate.endsAt.getTime()
      ) {
        return;
      }
      setTimeBlockOverrides((prev) => {
        const next = new Map(prev);
        next.set(drag.id, {
          startsAt: candidate.startsAt,
          endsAt: candidate.endsAt,
        });
        return next;
      });
      const result = await moveTimeBlockAction(
        drag.id,
        candidate.startsAt.toISOString(),
        candidate.endsAt.toISOString()
      );
      if (!result.ok) {
        toast.error(result.error);
        setTimeBlockOverrides((prev) => {
          const next = new Map(prev);
          next.delete(drag.id);
          return next;
        });
      }
    }
  }

  return {
    sensors,
    preview,
    effectiveAppt,
    effectiveBlock,
    handleDragMove,
    handleDragEnd,
  };
}
