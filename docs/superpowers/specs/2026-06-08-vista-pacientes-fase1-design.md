# Spec — Vista de pacientes (Fase 1)

- **Fecha:** 2026-06-08
- **Rama:** `feature/pacientes-fase1` (worktree `.worktrees/pacientes-fase1`)
- **Estado:** aprobada para implementación

## 1. Propósito

Convertir el CRUD plano actual de pacientes en una vista **master-detail** usable a
diario en recepción: buscar un paciente, abrir su ficha sin perder la lista, y consultar
sus datos, consultas y documentos. La vista reutiliza el lenguaje visual ya pulido de la
agenda (única vista de referencia de estilo del sistema).

### Criterio de éxito
- Recepción navega entre pacientes con menos clics que hoy (lista siempre visible).
- La ficha presenta los datos del paciente organizados en pestañas.
- El valor de cada orçamento se muestra como dato informativo.
- El alta de paciente se hace desde un panel lateral (`Sheet`) sin abandonar la lista.
- Cero regresiones de estilo: tokens y patrones idénticos a la agenda, light y dark.

## 2. Alcance

### Incluido (Fase 1)
- Layout master-detail (lista buscable + panel de detalle).
- Ficha con cabecera de identidad fija + pestañas: Resumo, Consultas, Orçamentos,
  Receitas, Atestados, Dados.
- Orçamentos mostrando su **valor** (Σ líneas − descuento) como dato informativo.
- Alta de paciente por `Sheet`.
- Filas de la lista enriquecidas: avatar (iniciales), edad, próxima consulta.

### Explícitamente fuera de alcance (Fase 2+)
- Estado de cuenta real: pagos, parcelas, `status` del orçamento (aprobado/pendiente).
- Alertas clínicas / anamnese / medicación.
- Evoluciones clínicas (nota por consulta).
- Odontograma e imágenes/radiografías.
- Pestañas como rutas anidadas (hoy son estado de cliente).
- Pre-llenado del paciente al pulsar "Agendar".

## 3. Arquitectura (rutas — Next 16 App Router)

```
app/(dashboard)/pacientes/
  layout.tsx        # cáscara master-detail: <PatientList> + {children}
  page.tsx          # estado vacío: "Selecione um paciente"
  [id]/page.tsx     # getPatientDetail(id) -> <PatientDetail patient={...} />
```

Decisiones fundamentadas (verificadas contra los docs de `node_modules/next/dist/docs`):

- **Cáscara = layout anidado.** `pacientes/layout.tsx` renderiza la lista a la izquierda
  (siempre visible) y `{children}` a la derecha. El paciente seleccionado vive en la URL
  (`/pacientes/[id]`) → deep-linkable.
- **Búsqueda en cliente.** Los layouts de App Router **no reciben `searchParams`**. El
  layout carga todos los pacientes una vez (server) y `<PatientList>` filtra en memoria.
  Para una clínica única es más rápido (sin round-trip) y es el patrón recomendado por el
  doc para "filtrar una lista ya cargada por props".
- **Fila activa** vía `useSelectedLayoutSegment()` (devuelve el `[id]` un nivel por debajo
  del layout de la lista).
- **Pestañas = estado de cliente, no rutas.** El detalle se trae en **una** query y un
  componente cliente alterna las pestañas. Menos archivos, una sola consulta. Se promueven
  a rutas en Fase 2 cuando pesen (odontograma, imágenes).

## 4. Componentes

| Componente | Tipo | Responsabilidad | Depende de |
|---|---|---|---|
| `components/patients/patient-list.tsx` | client | Búsqueda en memoria, botón "Novo paciente", filas (avatar/edad/próxima consulta), highlight de fila activa | `useSelectedLayoutSegment`, `PatientSheet`, `ui/avatar` |
| `components/patients/patient-detail.tsx` | client | Cabecera fija de identidad + acciones rápidas + pestañas | datos por props, `ui/avatar`, Hugeicons |
| `components/patients/patient-sheet.tsx` | client | Alta por `Sheet`, calcando `AppointmentSheet` | `ui/sheet`, `PatientForm`, `createPatientAction` |

Las pestañas dentro de `patient-detail.tsx`:

- **Resumo** — próxima consulta, última visita, total orçado, contadores de documentos.
- **Consultas** — lista de `appointments` (fecha, título, estado).
- **Orçamentos** — número, fecha, **valor**, forma de pago.
- **Receitas** — lista de `prescriptions` (fecha).
- **Atestados** — lista de `certificates` (fecha, vigencia).
- **Dados** — formulario de edición (`PatientForm` + `updatePatientAction`) y borrado
  (`deletePatientAction`).

## 5. Datos (cambios mínimos en `lib/modules/patients/service.ts`)

- `getPatientDetail(id)`: añadir `quotes: { include: { lines: true } }` para poder
  calcular el valor de cada orçamento en cliente:
  `valor = Σ line.totalPriceCents − quote.discountCents`.
- Nueva `listPatientDirectory()`: pacientes ordenados por nombre + su **próxima consulta**
  (include filtrado por `startsAt >= now`, `take: 1`, `orderBy startsAt asc`). No se toca
  `listPatients()` para no inflar el payload de la agenda (que la usa para el selector del
  `AppointmentSheet`).
- Reutilizados sin cambios: `formatBRL` (`lib/money.ts`), `formatDate`/`formatDateTime`
  (`lib/dates.ts`). Edad: cálculo inline desde `birthDate`.

## 6. Estilo (calca la agenda)

- Tokens semánticos: `bg-card`, `bg-primary`, `text-muted-foreground`, `border`. Nunca
  colores hardcodeados.
- Metadatos (edad, fechas, valor) en `font-mono tabular-nums`.
- Pestañas con el patrón segmented de la agenda: contenedor `bg-secondary p-0.5`, activo
  `bg-card text-foreground shadow-sm`, etiquetas `font-mono text-xs uppercase tracking-wider`.
- CTA primario: `h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground`.
- Iconos **Hugeicons** (`@hugeicons/react` + `core-free-icons`, size 16, stroke 1.75–2).
- `Sheet` y `Avatar` de `components/ui`. Acciones rápidas: WhatsApp (`wa.me/<dígitos>`),
  Agendar (`Link` a `/agenda`), Editar (cambia a la pestaña Dados).
- Tipografía global heredada por tokens: Outfit (sans) + JetBrains Mono (mono). Montserrat
  NO aplica aquí (es solo para PDFs institucionales).

## 7. Manejo de errores

- `getPatientDetail` usa `findUniqueOrThrow` → un `id` inexistente produce el 404 de Next
  (comportamiento ya existente, no se cambia).
- El alta/edición valida nombre + teléfono en el server action (ya existe). Los errores se
  muestran inline dentro del `Sheet`, igual que `AppointmentSheet`.

## 8. Qué se reemplaza (cambios quirúrgicos)

- `pacientes/page.tsx`: se elimina el formulario de alta incrustado y la lista plana; pasa
  a ser el estado vacío del panel de detalle.
- `pacientes/[id]/page.tsx`: el contenido actual (form + delete + cajas) se reorganiza
  dentro de `<PatientDetail>`. Se reutiliza `actions.ts` tal cual.
- `PatientForm` se reutiliza dentro de `PatientSheet` (alta) y de la pestaña Dados (edición).

## 9. Verificación

Fase 1 es UI; el repo no testea componentes, así que **no se añaden tests automatizados**
(se señala explícitamente para no aparentar cobertura inexistente).

1. Servicio (`getPatientDetail` con lines + `listPatientDirectory`) → `pnpm tsc --noEmit` limpio.
2. `/pacientes`: lista buscable, filas resaltan al navegar.
3. `/pacientes/[id]`: cabecera fija + 6 pestañas con datos correctos.
4. "Novo paciente": crea y selecciona el nuevo paciente.
5. Final: `pnpm build` ok + revisión visual en tema claro y oscuro.
