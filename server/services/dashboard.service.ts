export type ActivityEventKind =
  | "appointment.created"
  | "appointment.updated"
  | "appointment.cancelled"
  | "patient.created"
  | "quote.created"
  | "prescription.issued"
  | "certificate.issued";

export interface ActivityEvent {
  id: string;
  kind: ActivityEventKind;
  title: string;
  description?: string;
  href?: string;
  actor?: { id: string; name: string };
  timestamp: Date;
  seen: boolean;
}

export async function getRecentActivity(_opts: { limit: number }): Promise<ActivityEvent[]> {
  return [];
}

export async function getUnseenActivityCount(): Promise<number> {
  return 0;
}

export async function markActivityAsSeen(): Promise<void> {
  return;
}
