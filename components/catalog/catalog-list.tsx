"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Search01Icon } from "@hugeicons/core-free-icons";
import type { CatalogItem } from "@prisma/client";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/money";
import { CatalogSheet } from "@/components/catalog/catalog-sheet";

// Rejilla compartida por la cabecera de columnas y cada fila → columnas alineadas.
const GRID = "grid grid-cols-[1fr_6rem_9rem] items-center gap-x-6";

export function CatalogList({ items }: { items: CatalogItem[] }) {
  const [query, setQuery] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);

  const { active, inactive } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
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
            placeholder="Buscar procedimento"
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="button"
          onClick={() => setNewOpen(true)}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />
          Novo procedimento
        </button>
      </div>

      {total === 0 ? (
        <div className="grid min-h-[40vh] place-items-center">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {items.length === 0 ? "Nenhum procedimento cadastrado" : "Nenhum resultado"}
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
            <span>Procedimento</span>
            <span className="text-right">Duração</span>
            <span className="text-right">Preço</span>
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

      <CatalogSheet mode="create" open={newOpen} onOpenChange={setNewOpen} />
      {editing && (
        <CatalogSheet
          mode="edit"
          item={editing}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
}

function Row({ item, onEdit }: { item: CatalogItem; onEdit: () => void }) {
  const free = item.priceCents === 0;

  return (
    <button
      type="button"
      onClick={onEdit}
      className={cn(
        GRID,
        "group w-full rounded-md border-b border-border/50 px-2 py-2.5 text-left transition-colors last:border-b-0 hover:bg-secondary/40",
        !item.isActive && "text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "min-w-0 truncate text-sm font-medium transition-colors group-hover:text-primary",
          item.isActive ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {item.name}
      </span>
      <span className="text-right font-mono text-xs tabular-nums text-muted-foreground">
        {item.durationMinutes} min
      </span>
      {free ? (
        <span className="text-right font-mono text-xs text-muted-foreground">sob consulta</span>
      ) : (
        <span
          className={cn(
            "text-right font-mono text-sm font-semibold tabular-nums",
            item.isActive ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {formatBRL(item.priceCents)}
        </span>
      )}
    </button>
  );
}
