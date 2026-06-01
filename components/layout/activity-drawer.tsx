'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { api } from '@/lib/trpc/client';
import { ActivityEventRow } from '@/components/dashboard/activity-event';
import { isToday, isYesterday, differenceInDays } from 'date-fns';
import type { ActivityEvent } from '@/server/services/dashboard.service';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Groups {
  hoje: ActivityEvent[];
  ontem: ActivityEvent[];
  ultimos7: ActivityEvent[];
  maisAntigo: ActivityEvent[];
}

function groupByDate(events: ActivityEvent[]): Groups {
  const now = new Date();
  const groups: Groups = { hoje: [], ontem: [], ultimos7: [], maisAntigo: [] };

  for (const e of events) {
    if (isToday(e.timestamp)) groups.hoje.push(e);
    else if (isYesterday(e.timestamp)) groups.ontem.push(e);
    else if (differenceInDays(now, e.timestamp) <= 7) groups.ultimos7.push(e);
    else groups.maisAntigo.push(e);
  }

  return groups;
}

export function ActivityDrawer({ open, onOpenChange }: Props) {
  const utils = api.useUtils();
  const query = api.dashboard.getActivity.useQuery(
    { limit: 50 },
    {
      enabled: open,
      refetchInterval: open ? 60_000 : false,
      refetchOnWindowFocus: true,
    },
  );

  const markSeen = api.dashboard.markActivitySeen.useMutation({
    onSuccess: () => {
      utils.dashboard.getUnseenCount.invalidate();
    },
  });

  // Snapshot the set of "previously unseen" event IDs the first time data lands while open.
  // We use this to render the ámbar border/bg locally — independent of the server `seen`
  // flag, which flips for every event once `markActivitySeen` runs.
  // Spec §7.6: "el indicador visual persiste hasta cerrar el drawer".
  const [unseenSnapshot, setUnseenSnapshot] = useState<Set<string> | null>(null);

  // Capture the snapshot on first arrival of data per open cycle, then mark as seen.
  useEffect(() => {
    if (!open) return;
    if (unseenSnapshot !== null) return;
    if (!query.data) return;

    const ids = new Set(query.data.filter((e) => !e.seen).map((e) => e.id));
    setUnseenSnapshot(ids);
    markSeen.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query.data]);

  // Reset the snapshot when the drawer closes so the next open captures fresh state.
  useEffect(() => {
    if (!open) setUnseenSnapshot(null);
  }, [open]);

  // Decorate events with a local `seen` derived from the snapshot.
  const decoratedEvents = useMemo<ActivityEvent[]>(() => {
    const raw = query.data ?? [];
    if (!unseenSnapshot) return raw;
    return raw.map((e) => ({ ...e, seen: !unseenSnapshot.has(e.id) }));
  }, [query.data, unseenSnapshot]);

  const groups = useMemo(() => groupByDate(decoratedEvents), [decoratedEvents]);
  const unseenCount = unseenSnapshot?.size ?? decoratedEvents.filter((e) => !e.seen).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px] p-0">
        <SheetHeader className="sticky top-0 z-10 flex h-12 flex-row items-center justify-between border-b border-border bg-card px-4">
          <div className="flex items-baseline gap-2">
            <SheetTitle className="text-sm font-medium">Atividade</SheetTitle>
            {unseenCount > 0 && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{unseenCount} novas</span>
              </>
            )}
          </div>
          <SheetClose asChild>
            <button className="rounded p-1 hover:bg-surface-2" aria-label="Fechar">
              <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.5} />
            </button>
          </SheetClose>
        </SheetHeader>

        <div className="flex flex-col">
          {query.isLoading && (
            <div className="space-y-1 p-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-surface-2" />
              ))}
            </div>
          )}

          {!query.isLoading && query.error && (
            <div className="p-4 font-mono text-xs text-destructive">
              erro ·{' '}
              <button onClick={() => query.refetch()} className="underline">
                tentar novamente
              </button>
            </div>
          )}

          {!query.isLoading && !query.error && (query.data?.length ?? 0) === 0 && (
            <div aria-live="polite" className="py-12 text-center text-sm text-muted-foreground">
              nenhuma atividade recente
            </div>
          )}

          {groups.hoje.length > 0 && <GroupSection label="Hoje" events={groups.hoje} />}
          {groups.ontem.length > 0 && <GroupSection label="Ontem" events={groups.ontem} />}
          {groups.ultimos7.length > 0 && (
            <GroupSection label="Últimos 7 dias" events={groups.ultimos7} />
          )}
          {groups.maisAntigo.length > 0 && (
            <GroupSection label="Mais antigo" events={groups.maisAntigo} />
          )}
        </div>

        <footer className="sticky bottom-0 border-t border-border bg-card p-3">
          <Link
            href="/activity"
            className="font-mono text-[11px] text-muted-foreground hover:text-foreground"
          >
            ver atividade completa →
          </Link>
        </footer>
      </SheetContent>
    </Sheet>
  );
}

function GroupSection({ label, events }: { label: string; events: ActivityEvent[] }) {
  return (
    <div>
      <div className="px-4 pt-4 pb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {events.map((e) => (
        <ActivityEventRow key={e.id} event={e} />
      ))}
    </div>
  );
}
