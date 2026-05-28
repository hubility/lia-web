"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-zinc-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-red-600"
        />
        {state.errors?.email && <p className="text-sm text-red-700">{state.errors.email[0]}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium text-zinc-700">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-red-600"
        />
        {state.errors?.password && (
          <p className="text-sm text-red-700">{state.errors.password[0]}</p>
        )}
      </div>

      {state.message && <p className="text-sm text-red-700">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-md bg-red-700 px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
