# Session: Design system tokens + layout shell adaptation
Date: 2026-05-28
Project: lia-web (.worktrees/lia-web-platform)

## Goal
Build the shadcn-standard design system from the agenda HTML reference, then make the pasted "frotas" layout components compile as-is and adapt them to the lia-web dental clinic domain.

## Decisions
- **Token naming follows the shadcn standard set, no invention.** First attempt offered semantic alternatives (`--proc-*`) for procedure colors; user rejected the choice and signaled "just use the standard." Procedure palette mapped to `--chart-1..8`.
- **Kept hex values from the reference** instead of converting to oklch — avoids color drift while still being valid Tailwind v4 / shadcn syntax.
- **Two-phase integration of the pasted layout components**: (1) install all dependencies and scaffold internal stubs so the files compile without modification; (2) adapt content (brand, nav, auth) only after the build was green. This separates "make it work" from "make it ours" and lets each phase verify independently.
- **tRPC scaffolded for real, not faked.** Real router + service stubs (returning empty data) was cheaper than mocking the `api` object shape — types flow naturally from server to client, and adding endpoints later won't require swapping a fake for a real implementation.
- **`TRPCProvider` lives in `(dashboard)/layout.tsx`, not root.** `/login` doesn't need a QueryClient or tRPC client; only authenticated routes do. `ThemeProvider` stays at root because theme applies everywhere.
- **`user-menu.tsx` swapped from `next-auth.signOut` to `<form action={logoutAction}>`** using the project's existing server action. `next-auth` was then fully removed (was unused everywhere else).
- **shadcn `components.json` written manually** instead of `shadcn init`, so the existing `globals.css` (already containing our token block) isn't overwritten by the init template.

## Work Done
- `app/globals.css`: full shadcn token set (light + dark) with `@custom-variant dark`, `@theme inline` mapping, fonts via `next/font` variables, `tw-animate-css` import, custom tokens `--surface-2`, `--amber`, `--duration-{fast,base,slow}`, `--ease-{out,in-out}`
- `app/layout.tsx`: Outfit + JetBrains Mono via `next/font/google` as CSS variables; root wraps only `ThemeProvider`
- `app/(dashboard)/layout.tsx`: wraps `AppShell` in `TRPCProvider`
- `components.json` + `lib/utils.ts` written manually (no `shadcn init`)
- shadcn components added: `tooltip`, `dropdown-menu`, `avatar`, `sheet`
- tRPC scaffolding: `server/api/{trpc.ts, root.ts, routers/dashboard.ts}`, `server/services/dashboard.service.ts` (exports `ActivityEvent` type + empty-returning service fns), `app/api/trpc/[trpc]/route.ts`, `lib/trpc/{client.ts, provider.tsx}`
- `components/theme-provider.tsx` (next-themes with `attribute="data-theme"`)
- `components/dashboard/activity-event.tsx` (`ActivityEventRow` consumed by `activity-drawer.tsx`)
- Adapted `components/layout/sidebar.tsx`: brand "frotas"→"lia", nav→Agenda/Pacientes/Orçamentos/Receitas/Atestados/Catálogo/Usuários, icon mapping via hugeicons, role-based filtering via `canAccessResource`
- Adapted `components/layout/breadcrumb.tsx`: BRAND "Frotas"→"Lia", home `/dashboard`→`/agenda`
- Rewrote `components/layout/user-menu.tsx`: `next-auth` removed, logout via server-action form
- Rewrote `components/app-shell.tsx`: composes `Sidebar` + `Topbar` + main, reserves 52px for collapsed sidebar
- Removed `next-auth` from dependencies

## Learnings
- **HugeIcons `.d.ts` types diverge from runtime exports.** `dist/types/index.d.ts` declares icons like `ToothIcon` that aren't present in `dist/esm/index.min.js`. Always grep the actual JS bundle when picking icons. Dental icons live under the `Dental*` prefix (`DentalToothIcon`, `DentalCareIcon`, `DentalBracesIcon`).
- **Tailwind v4 has numeric arbitrary spacing as canonical.** `pl-[52px]` → `pl-13` because `13 × 0.25rem = 3.25rem = 52px`. CSS linter flags `[52px]` as non-canonical.
- **`@custom-variant` triggers a benign CSS linter warning** ("Unknown at rule") — it's valid Tailwind v4 syntax; ignore.
- **shadcn CLI with `--yes --overwrite` doesn't clobber a hand-written `globals.css`.** It only writes the component files into `components/ui/` and adds peer dependencies. Safe to use after manual token setup.
- **Layout shells often hide auth coupling in the user menu.** Of the six pasted layout components, only `user-menu.tsx` had hard-coded auth (`next-auth.signOut`). Everything else was UX-only and adapted cleanly.

## Key Files
.worktrees/lia-web-platform/app/globals.css
.worktrees/lia-web-platform/app/layout.tsx
.worktrees/lia-web-platform/app/(dashboard)/layout.tsx
.worktrees/lia-web-platform/app/api/trpc/[trpc]/route.ts
.worktrees/lia-web-platform/components.json
.worktrees/lia-web-platform/lib/utils.ts
.worktrees/lia-web-platform/lib/trpc/client.ts
.worktrees/lia-web-platform/lib/trpc/provider.tsx
.worktrees/lia-web-platform/server/api/trpc.ts
.worktrees/lia-web-platform/server/api/root.ts
.worktrees/lia-web-platform/server/api/routers/dashboard.ts
.worktrees/lia-web-platform/server/services/dashboard.service.ts
.worktrees/lia-web-platform/components/theme-provider.tsx
.worktrees/lia-web-platform/components/app-shell.tsx
.worktrees/lia-web-platform/components/layout/sidebar.tsx
.worktrees/lia-web-platform/components/layout/breadcrumb.tsx
.worktrees/lia-web-platform/components/layout/user-menu.tsx
.worktrees/lia-web-platform/components/dashboard/activity-event.tsx
