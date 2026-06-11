"use client";

import { useEffect, useRef } from "react";
import { Odontogram, type ToothDetail, type ToothConditionGroup } from "react-odontogram";
import "react-odontogram/style.css";
import { useTheme } from "next-themes";
import { toothTypePt } from "@/lib/patients/tooth";

interface Props {
  conditions: ToothConditionGroup[];
  onSelect: (tooth: ToothDetail | null) => void;
}

export function OdontogramChart({ conditions, onSelect }: Props) {
  const { resolvedTheme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  // La librería pinta un <title> por diente → tooltip nativo del navegador (feo).
  // Lo quitamos para dejar solo el tooltip estilizado en PT.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const strip = () => root.querySelectorAll("svg title").forEach((t) => t.remove());
    strip();
    const obs = new MutationObserver(strip);
    obs.observe(root, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="mx-auto w-full max-w-[460px]">
      <Odontogram
        notation="FDI"
        singleSelect
        tooltip={{
          content: (tooth) =>
            tooth ? `Dente ${tooth.notations.fdi} · ${toothTypePt(tooth.type)}` : null,
        }}
        showHalf="full"
        layout="circle"
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        colors={{
          darkBlue: "var(--primary)",
          baseBlue: "var(--muted-foreground)",
          lightBlue: "color-mix(in srgb, var(--primary) 14%, transparent)",
        }}
        teethConditions={conditions}
        onChange={(teeth: ToothDetail[]) => onSelect(teeth[0] ?? null)}
      />
    </div>
  );
}
