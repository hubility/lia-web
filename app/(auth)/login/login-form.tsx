"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

const labelClass =
  "font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";
const inputClass =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input id="email" name="email" type="email" required autoFocus className={inputClass} />
        {state.errors?.email && (
          <p className="text-sm text-destructive">{state.errors.email[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className={labelClass}>
          Senha
        </label>
        <input id="password" name="password" type="password" required className={inputClass} />
        {state.errors?.password && (
          <p className="text-sm text-destructive">{state.errors.password[0]}</p>
        )}
      </div>

      {state.message && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-10 w-full rounded-md bg-primary font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{
          transitionDuration: "var(--duration-fast)",
          transitionTimingFunction: "var(--ease-out)",
        }}
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
