'use client';

import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Notification03Icon } from '@hugeicons/core-free-icons';
import { api } from '@/lib/trpc/client';
import { ActivityDrawer } from '@/components/layout/activity-drawer';

export function NotificationTrigger() {
  const [open, setOpen] = useState(false);
  const { data: unseenCount } = api.dashboard.getUnseenCount.useQuery(undefined, {
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const hasUnseen = (unseenCount ?? 0) > 0;
  const ariaLabel = hasUnseen ? `Atividade · ${unseenCount} novas` : 'Atividade';

  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen(true)}
        className="relative p-2 rounded-md hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <HugeiconsIcon icon={Notification03Icon} size={18} strokeWidth={1.5} />
        {hasUnseen && (
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        )}
      </button>
      <ActivityDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}
