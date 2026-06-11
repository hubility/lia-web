# Session: Deploy a Vercel — commit/merge a main, recuperación de archivos y error del motor de Prisma
Date: 2026-06-01 21:00
Project: lia-web (repo raíz, post-merge)

## Goal
Dejar la rama `feature/lia-web-platform` commiteada y mergeada a `main`, subir el repo a
GitHub y dejar el deploy en Vercel funcionando. El grueso del tiempo se fue en un error de
runtime de Prisma en Vercel ("could not locate the Query Engine for rhel-openssl-3.0.x").

## Decisions
- **`master` → `main`**: renombrado local (`git branch -m`), no había remoto. Merge `--no-ff`
  de la feature a main.
- **`app/generated/` fuera de git + `postinstall: prisma generate`**: el repo versionaba el
  cliente Prisma generado (22MB, incluido el binario de Windows, inútil en Linux). Se
  des-trackeó y se añadió `postinstall` para regenerar en el build de Vercel.
- **Lock de pnpm sincronizado**: `@scalar/nextjs-api-reference` estaba en package.json pero
  no en `pnpm-lock.yaml` (se instaló con npm en una sesión previa → de ahí un
  `package-lock.json` accidental). Vercel falla con `--frozen-lockfile`; se regeneró con
  `pnpm install`.
- **Schema en Neon vía `prisma migrate deploy`**: la BD de Neon existía pero estaba vacía
  (0 migraciones aplicadas). El seed fallaba con P2021 porque las tablas no existían. El seed
  solo inserta filas; las tablas las crean las migraciones. `migrate deploy` (no `migrate dev`)
  para BD remota. El pooler de Neon aguantó las migraciones sin problema.
- **CAUSA RAÍZ del error del motor + FIX: cambiar el generador `prisma-client` →
  `prisma-client-js`.** El generador nuevo (`prisma-client`) con `output` custom dentro de
  `app/` hace que Turbopack empaquete el cliente dentro de los chunks SSR; el binario del
  motor (`.so.node`) no se copia a la función serverless → error en runtime. El generador
  clásico (`prisma-client-js`) genera en `node_modules/.prisma/client`, que Next trata como
  externo por defecto (`serverExternalPackages` ya incluye `@prisma/client`) → el motor se
  resuelve solo, SIN tocar `next.config`. Cambio: quitar `output`, `provider =
  "prisma-client-js"`, y reescribir los 22 imports de `@/app/generated/prisma/client` a
  `@prisma/client`.

## Work Done
- Commit de la sesión de Scalar en la feature; rename master→main; merge a main.
- `.gitignore`: ignorar `/app/generated/`. `package.json`: `postinstall: prisma generate`.
  `git rm --cached app/generated`.
- Recuperados `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` tras un commit
  "delete locks" que los borró por error (sin package.json Vercel no detecta Next.js).
- `pnpm install` para sincronizar el lock con @scalar. Push a `origin` (github.com/hubility/lia-web).
- `prisma migrate deploy` + `pnpm db:seed` contra Neon (admin `lia@hubilityai.com` / `123456`
  default; API key se imprime una sola vez).
- **Cambio de generador a `prisma-client-js`**: schema actualizado, `output` eliminado, 22
  imports reescritos a `@prisma/client` (vía sed). `next.config.ts` se dejó vacío.
- **PENDIENTE (no verificado al cerrar la sesión)**: `pnpm prisma generate`, `pnpm build`,
  borrar la carpeta vieja `app/generated/`, commit + push, y confirmar el deploy en Vercel.

## Learnings
- **El error "engine not found" en Vercel es de empaquetado, no de tu código.** Next 16 +
  Turbopack no traza el `.so.node` como dependencia cuando el cliente vive dentro de `app/`
  (output custom). Soluciones de foros: binaryTargets, copiar a mano, plugin de monorepo
  (poco fiables); `outputFileTracingIncludes → node_modules/.prisma/client` (confirmado, pero
  para output por defecto); driver adapter sin motor (lo más reciente, 2026, para output
  custom). La salida más simple para este proyecto fue volver al generador clásico.
- **`@prisma/client` está en la lista `serverExternalPackages` por defecto de Next** → con el
  generador clásico no hace falta config extra. El output custom rompía justo esto.
- **FEEDBACK del usuario (proceso): no sobre-ingenierizar ni marear.** El fix de fondo era,
  en esencia, cambiar una línea del generador (+ imports mecánicos). En vez de eso di vueltas
  ~2h: propuse driver adapters, `engineType="client"`, `outputFileTracingIncludes`,
  binaryTargets, hice demasiadas preguntas (AskUserQuestion repetidas) y presenté una solución
  de comunidad como si fuera oficial. El usuario lo rechazó repetidamente y acabó muy
  frustrado. **Cómo aplicar:** ir primero a la opción más simple/estándar, verificar antes de
  proponer, una hipótesis cada vez, respuestas cortas, y no preguntar lo que se puede decidir
  con defaults sensatos.
- **`tsx prisma/seed.ts` carga `.env` a mano** (parser propio en seed.ts), no depende de
  dotenv automático. No era un problema de entorno: la BD estaba vacía.

## Key Files
prisma/schema.prisma
lib/db/prisma.ts
next.config.ts
package.json
.gitignore
prisma/seed.ts
