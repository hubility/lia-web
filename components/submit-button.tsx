"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
    >
      {pending ? "Salvando..." : children}
    </button>
  );
}
