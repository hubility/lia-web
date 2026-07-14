"use client";

import { useState } from "react";
import type { CatalogItem, CidCode, Medication } from "@prisma/client";
import { cn } from "@/lib/utils";
import { CatalogList } from "@/components/catalog/catalog-list";
import { MedicationList } from "@/components/catalog/medication-list";
import { CidList } from "@/components/catalog/cid-list";

type Tab = "procedimentos" | "medicamentos" | "cid";

const TABS: { id: Tab; label: string }[] = [
  { id: "procedimentos", label: "Procedimentos" },
  { id: "medicamentos", label: "Medicamentos" },
  { id: "cid", label: "CID" },
];

export function CatalogTabs({
  items,
  medications,
  cidCodes,
}: {
  items: CatalogItem[];
  medications: Medication[];
  cidCodes: CidCode[];
}) {
  const [tab, setTab] = useState<Tab>("procedimentos");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex w-fit items-center gap-0.5 rounded-md bg-secondary p-0.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-sm px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider transition-colors",
              tab === t.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "procedimentos" && <CatalogList items={items} />}
      {tab === "medicamentos" && <MedicationList items={medications} />}
      {tab === "cid" && <CidList items={cidCodes} />}
    </div>
  );
}
