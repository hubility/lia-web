import type { Appointment, TimeBlock } from "@prisma/client";

export type Candidate = {
  startsAt: Date;
  durationMinutes: number;
};

export type Range = {
  start: number;
  end: number;
};

export type CollisionTarget =
  | { kind: "appointment"; id: string; label: string }
  | { kind: "timeblock"; id: string; label: string; blockKind: "lunch" | "block" };

function rangeOf(startsAt: Date, durationMinutes: number): Range {
  const start = startsAt.getTime();
  return { start, end: start + durationMinutes * 60_000 };
}

function blockRange(b: Pick<TimeBlock, "startsAt" | "endsAt">): Range {
  return { start: new Date(b.startsAt).getTime(), end: new Date(b.endsAt).getTime() };
}

function overlaps(a: Range, b: Range): boolean {
  return a.start < b.end && b.start < a.end;
}

export function findCollision(
  candidate: Candidate,
  appointments: Pick<Appointment, "id" | "startsAt" | "durationMinutes" | "title" | "status">[],
  timeBlocks: Pick<TimeBlock, "id" | "startsAt" | "endsAt" | "kind" | "label">[],
  excludeId?: string
): CollisionTarget | null {
  const candidateRange = rangeOf(candidate.startsAt, candidate.durationMinutes);

  for (const appt of appointments) {
    if (appt.id === excludeId) continue;
    if (appt.status === "cancelled") continue;
    const apptRange = rangeOf(new Date(appt.startsAt), appt.durationMinutes);
    if (overlaps(candidateRange, apptRange)) {
      return { kind: "appointment", id: appt.id, label: appt.title };
    }
  }

  for (const block of timeBlocks) {
    if (block.id === excludeId) continue;
    if (overlaps(candidateRange, blockRange(block))) {
      return {
        kind: "timeblock",
        id: block.id,
        label: block.label,
        blockKind: block.kind,
      };
    }
  }

  return null;
}
