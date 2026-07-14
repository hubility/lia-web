"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Search01Icon } from "@hugeicons/core-free-icons";
import type { CidCode } from "@prisma/client";
import { cn } from "@/lib/utils";
import { CidSheet } from "@/components/catalog/cid-sheet";

const GRID = "grid grid-cols-[5rem_1fr] items-center gap-x-6";

export function CidList({ items }: { items: CidCode[] }) {
  const [query, setQuery] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [editing, setEditing] = useState<CidCode | null>(null);

  const { active, inactive } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? items.filter(
          (i) =>
            i.code.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
        )
      : items;
    return {
      active: matched.filter((i) => i.isActive),
      inactive: matched.filter((i) => !i.isActive),
    };
  }, [items, query]);

  const total = active.length + inactive.length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={1.75} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por código ou descrição"
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="button"
          onClick={() => setNewOpen(true)}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />
          Novo CID
        </button>
      </div>

      {total === 0 ? (
        <div className="grid min-h-[40vh] place-items-center">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {items.length === 0 ? "Nenhum CID cadastrado" : "Nenhum resultado"}
          </p>
        </div>
      ) : (
        <div className="-mx-2">
          <div
            className={cn(
              GRID,
              "border-b px-2 pb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            )}
          >
            <span>Código</span>
            <span>Descrição</span>
          </div>

          {active.map((item) => (
            <Row key={item.id} item={item} onEdit={() => setEditing(item)} />
          ))}

          {inactive.length > 0 && (
            <p className="px-2 pb-1 pt-6 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Inativos · {inactive.length}
            </p>
          )}
          {inactive.map((item) => (
            <Row key={item.id} item={item} onEdit={() => setEditing(item)} />
          ))}
        </div>
      )}

      <CidSheet mode="create" open={newOpen} onOpenChange={setNewOpen} />
      {editing && (
        <CidSheet
          mode="edit"
          item={editing}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
}

function Row({ item, onEdit }: { item: CidCode; onEdit: () => void }) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className={cn(
        GRID,
        "group w-full rounded-md border-b border-border/50 px-2 py-2.5 text-left transition-colors last:border-b-0 hover:bg-secondary/40"
      )}
    >
      <span
        className={cn(
          "font-mono text-sm font-semibold tabular-nums transition-colors group-hover:text-primary",
          item.isActive ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {item.code}
      </span>
      <span
        className={cn(
          "min-w-0 truncate text-sm",
          item.isActive ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {item.description}
      </span>
    </button>
  );
}
