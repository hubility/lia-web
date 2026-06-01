import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { ActivityEvent } from "@/server/services/dashboard.service";

interface Props {
  event: ActivityEvent;
}

export function ActivityEventRow({ event }: Props) {
  const content = (
    <div
      className={cn(
        "flex flex-col gap-0.5 border-l-2 px-4 py-2.5 transition-colors",
        event.seen
          ? "border-transparent hover:bg-surface-2"
          : "border-primary bg-primary/5 hover:bg-primary/10",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{event.title}</span>
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          {formatDistanceToNow(event.timestamp, { addSuffix: true, locale: ptBR })}
        </span>
      </div>
      {event.description && (
        <p className="text-xs text-muted-foreground">{event.description}</p>
      )}
    </div>
  );

  if (event.href) {
    return <Link href={event.href}>{content}</Link>;
  }

  return content;
}
