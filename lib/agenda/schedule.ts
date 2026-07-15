export type ClinicSchedule = {
  opensAtMinutes: number;
  closesAtMinutes: number;
};

export const DEFAULT_CLINIC_SCHEDULE: ClinicSchedule = {
  opensAtMinutes: 8 * 60,
  closesAtMinutes: 19 * 60,
};

export const MIN_SCHEDULE_MINUTES = 60;
export const MAX_MINUTES_IN_DAY = 24 * 60;

export function normalizeClinicSchedule(
  schedule: Partial<ClinicSchedule> | null | undefined
): ClinicSchedule {
  const opensAtMinutes = Number(schedule?.opensAtMinutes);
  const closesAtMinutes = Number(schedule?.closesAtMinutes);
  if (
    !Number.isInteger(opensAtMinutes) ||
    !Number.isInteger(closesAtMinutes) ||
    opensAtMinutes < 0 ||
    closesAtMinutes > MAX_MINUTES_IN_DAY ||
    closesAtMinutes - opensAtMinutes < MIN_SCHEDULE_MINUTES
  ) {
    return DEFAULT_CLINIC_SCHEDULE;
  }
  return { opensAtMinutes, closesAtMinutes };
}

export function scheduleDurationMinutes(schedule: ClinicSchedule): number {
  return schedule.closesAtMinutes - schedule.opensAtMinutes;
}

export function clampScheduleOffset(
  offsetMinutes: number,
  itemDurationMinutes: number,
  schedule: ClinicSchedule
): number {
  const latestStart = Math.max(
    0,
    scheduleDurationMinutes(schedule) - itemDurationMinutes
  );
  return Math.max(0, Math.min(latestStart, offsetMinutes));
}

export function minutesFromScheduleStart(date: Date, schedule: ClinicSchedule): number {
  return date.getHours() * 60 + date.getMinutes() - schedule.opensAtMinutes;
}

export function applyMinutesToScheduleDay(
  day: Date,
  minutesFromStart: number,
  schedule: ClinicSchedule
): Date {
  const total = schedule.opensAtMinutes + minutesFromStart;
  const date = new Date(day);
  date.setHours(Math.floor(total / 60), total % 60, 0, 0);
  return date;
}

export function isWithinClinicSchedule(
  startsAt: Date,
  durationMinutes: number,
  schedule: ClinicSchedule
): boolean {
  const start = startsAt.getHours() * 60 + startsAt.getMinutes();
  return start >= schedule.opensAtMinutes && start + durationMinutes <= schedule.closesAtMinutes;
}

export function formatClockMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export type ScheduleTick = {
  offsetMinutes: number;
  label: string;
};

export function buildScheduleTicks(schedule: ClinicSchedule): ScheduleTick[] {
  const ticks: ScheduleTick[] = [
    { offsetMinutes: 0, label: formatClockMinutes(schedule.opensAtMinutes) },
  ];
  let minute = Math.ceil((schedule.opensAtMinutes + 1) / 60) * 60;
  while (minute < schedule.closesAtMinutes) {
    ticks.push({
      offsetMinutes: minute - schedule.opensAtMinutes,
      label: formatClockMinutes(minute),
    });
    minute += 60;
  }
  ticks.push({
    offsetMinutes: scheduleDurationMinutes(schedule),
    label: formatClockMinutes(schedule.closesAtMinutes),
  });
  return ticks;
}

export function parseClockInput(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}
