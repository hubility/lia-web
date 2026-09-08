# Session: Botón de play/pause de Lia en la toolbar
Date: 2026-08-20 20:15
Project: lia-web

## Goal
Dar al doctor un control accesible en la toolbar para pausar y reanudar a Lia sin
salir del panel clínico.

## Decisions

**El interruptor es `Agent.isActive` en la plataforma, no un campo nuevo.** El
mecanismo de pausa global ya existía y funcionaba: no había que construir nada en
el agente, solo una vía de escritura.

**Endpoint REST en la plataforma, no escritura directa ni tRPC.** Se evaluaron tres
caminos y se descartaron dos:

- *Escritura directa a la Supabase de la plataforma desde lia-web*: es una línea de
  SQL, pero convierte a lia-web en un segundo escritor de una tabla que no le
  pertenece, se salta el control de propiedad del agente y lo acopla a un schema
  ajeno. Precedente parcial: agente-LIA sí lee esa base con su propio Prisma, pero
  leer no equivale a escribir estado de control.
- *Hablar por tRPC con la plataforma*: `agent.update` es `protectedProcedure` y
  exige cookie de sesión NextAuth. Obligaría a simular un login de navegador (CSRF,
  cookie, renovación) y a guardar una contraseña de la plataforma en lia-web.
- *Elegido*: `POST/GET /api/agent-status` con secreto compartido en cabecera,
  copiando el patrón de `events-hook` (fallo cerrado). El toggle del console de la
  plataforma y el botón del panel quedan sobre la misma fuente de verdad.

**`protectedProcedure` nuevo en el tRPC de lia-web.** El contexto no tenía
autenticación y todos los routers existentes son `publicProcedure`. Pausar el
agente no podía quedar expuesto a cualquiera que llamase a `/api/trpc`.

**El estado pausado se señaliza con rótulo, no solo con icono.** Con Lia pausada el
agente descarta mensajes en silencio: si nadie lo nota, los pacientes quedan sin
atención. Activa es un icono gris; pausada pasa a rojo y aparece "Lia pausada".

**Commit aparte para los archivos sueltos de `public/`.** Un acceso directo de
Windows y un PDF de prueba, en `09d2b85`, para que revertirlos sea trivial.

## Work Done

- Servicio `lia-status.service.ts`: lee y escribe el estado contra la plataforma.
  Un único importador (el router tRPC), así que la llamada nunca sale del navegador.
- Router tRPC `lia` con `getStatus` / `setStatus`, traduciendo fallos de la
  plataforma a `BAD_GATEWAY` con mensaje legible.
- `protectedProcedure` añadido a `server/api/trpc.ts`.
- Componente `LiaToggle` montado en la toolbar, con degradación a "Lia indisponível"
  si la plataforma no responde.
- Handoff escrito en el repo de la plataforma
  (`HANDOFF-agent-status-endpoint.md`) para que otra instancia implementase el
  endpoint desde contexto vacío. Implementado y verificado allí: 12 casos.
- Verificación contra producción: `GET` con secreto válido → 200; con secreto
  inválido → 401; sin la variable de entorno → 503.

## Learnings

**Lia se detiene por dos mecanismos distintos e independientes**, montados como
gates en cadena sobre el provider de Meta en `agente-LIA/src/app.ts`:

| | Pausa global | Pausa por conversación |
|---|---|---|
| Origen | `Agent.isActive` en la BD de la plataforma | Evento `message_echo` de Meta |
| Disparador | Toggle manual | El doctor responde desde WhatsApp Business |
| Alcance | Todas las conversaciones | Solo ese paciente |
| Estado | Fila de Postgres | `Map` en memoria del proceso |
| Duración | Hasta reactivar | 10 minutos |

`createStatusGate()` consulta `Agent.isActive` en cada mensaje entrante con
microcaché de 5 s y *fail-open*: pausar surte efecto en segundos sin redespliegue,
y un fallo de BD nunca deja al cliente sin agente.

**Son tres bases de datos, no una.** lia-web usa Neon (`ep-orange-cell`); la
plataforma y agente-LIA comparten Supabase (`qiaqavuakghghswhocfu`). Por eso lia-web
no puede compartir cliente de Prisma y necesita el endpoint.

**El `matcher` del middleware de la plataforma no cubre `/api/*`** (solo
`/dashboard`, `/agents`, `/settings`, `/manager`): cualquier ruta nueva bajo `/api`
tiene que autenticarse ella misma.

**Lia estaba en `isActive: false` en producción** antes de tocar nada, y así quedó.
Decisión pendiente del usuario.

**El id del agente de Darcy es `cmpupul530003qc1d7058f2rf`** (el `HUBILITY_AGENT_ID`
del `.env` de agente-LIA).

## Key Files
server/services/lia-status.service.ts
server/api/routers/lia.ts
server/api/trpc.ts
server/api/root.ts
components/layout/lia-toggle.tsx
components/layout/topbar.tsx
.env.example
