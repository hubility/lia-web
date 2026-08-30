# HANDOFF — Ruta de PDF de receita para el agente (lia-web)

**Fecha:** 2026-08-30
**Estado:** **HECHO y verificado en producción.** Commit `818f90d` en `main`, desplegado en Vercel.
Probado con la receita `cmtd3i1du0001kw04jpt4hu96`: 200 + PDF válido con api key, 401 sin ella.
El trabajo pendiente está en `agente-LIA` (commit/deploy/prueba real) — ver su HANDOFF.
**Contexto completo:** `DARCY/agente-LIA/HANDOFF-pdf-documentos-whatsapp.md` (diseño confirmado por el usuario).

## Qué es esto

Cuando el Dr. Darcy dicta una receita por WhatsApp (modo admin), la tool `create_prescription`
del agente la crea vía POST y ahora debe enviarle el PDF al chat. El POST devuelve solo campos
escalares y la ruta de PDF existente (`/api/pdf/receitas/[id]`) usa `requirePermission`, que solo
acepta sesión de navegador. Por eso el agente necesita una ruta propia autenticada con `x-api-key`.

El envío por WhatsApp lo hace el agente (repo `agente-LIA`), no este repo. Aquí solo se sirve el PDF.

## Cambios ya escritos en este repo

1. **`app/api/agent/v1/prescriptions/[id]/pdf/route.ts`** (nuevo):
   `GET` con `withApiErrors` + `requireApiKey` + `getPrescription(id)` + `getClinicProfile()` +
   `renderPdfToBuffer(PrescriptionDocument)` → `Response` con `content-type: application/pdf`.
   Sigue el estilo de las rutas hermanas (`type Ctx = { params: Promise<{ id: string }> }`).
   Sin `content-disposition`: el nombre del fichero lo decide el agente al enviarlo.

2. **`docs/api/openapi.yaml`**: añadida la entrada `/api/agent/v1/prescriptions/{id}/pdf`
   (tag `Receitas`, respuesta `application/pdf` binaria, 401 Unauthorized).

## Qué falta en este repo

- Nada para receitas. Build de Vercel OK y ruta probada en producción (2026-08-30).
- Atestado y orçamento: replicar la ruta + openapi solo después de la prueba real por WhatsApp.
- Nota aceptada: un id inexistente devuelve 500 (`findUniqueOrThrow` → `withApiErrors`), no 404.
  El agente siempre pide el id que acaba de crear. No "mejorar" sin preguntar.

## Decisiones cerradas — no reabrir

- No se archivan PDFs (se generan al vuelo, como siempre).
- No se toca `requirePermission` ni el contrato del POST.
- No extraer el render a un helper compartido (4 líneas repetidas no justifican la abstracción).
- Solo receitas en esta iteración; atestado y orçamento después de probar en real.

## La otra mitad (repo agente-LIA, ya escrita, no tocar desde aquí)

- `LiaToolContext` declara `provider.sendFile`.
- `LiaApiClient.getPrescriptionPdf(id)` descarga el binario (fuera de `request()`).
- `create_prescription` descarga el PDF, lo escribe en tmp como
  `receita-<paciente>-<AAAA-MM-DD>.pdf`, lo envía con `provider.sendFile` al doctor y lo borra.
  Si falla, devuelve el registro con `pdfSent: false` (nunca error: la receita ya existe).
- Typecheck de agente-LIA: **pasa**.
