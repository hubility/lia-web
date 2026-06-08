"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PatientForm } from "@/app/(dashboard)/pacientes/patient-form";
import { createPatientAction } from "@/app/(dashboard)/pacientes/actions";

export function PatientSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const openedAt = useRef(pathname);

  // Registra la ruta al abrir; al crear, el server action redirige a
  // /pacientes/[id] -> cambia el pathname -> cerramos el Sheet.
  useEffect(() => {
    if (open) openedAt.current = pathname;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open && pathname !== openedAt.current) onOpenChange(false);
  }, [pathname, open, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Novo paciente</SheetTitle>
          <SheetDescription>Cadastre os dados básicos. Você poderá completar depois.</SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto px-4 pb-4">
          <PatientForm action={createPatientAction} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
