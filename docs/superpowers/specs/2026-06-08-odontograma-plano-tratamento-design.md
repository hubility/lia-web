# Spec — Odontograma + plano de tratamento

- **Fecha:** 2026-06-08
- **Rama:** `feature/pacientes-fase1` (worktree `.worktrees/pacientes-fase1`)
- **Estado:** pendiente de revisión del usuario

## 1. Propósito

Convertir la primera pestaña de la ficha del paciente en el **centro de trabajo clínico
diario**: un odontograma interactivo donde el dentista selecciona una pieza, ve todo lo
que esa pieza tiene históricamente (realizado + planificado), le añade tratamientos desde
el catálogo y genera un orçamento con esos tratamientos — todo en una sola interfaz.

Reemplaza a la pestaña **"Resumo"** (eliminada: solo mostraba tres tarjetas y no aportaba
valor al día a día).

### Criterio de éxito
- El dentista selecciona una pieza y ve **todo su historial** de tratamientos en un clic
  (modo consulta).
- Puede añadir uno o varios tratamientos planificados a una pieza desde el catálogo.
- Puede generar un orçamento a partir de los tratamientos planificados, que aparece en la
  pestaña Orçamentos.
- La secuencia clínica real (p. ej. Extração y luego Implante en la misma pieza) queda
  registrada como historial ordenado de esa pieza.
- Cero regresiones de estilo: tokens y patrones idénticos a la agenda, light y dark.

## 2. Alcance

### Incluido (v1)
- Pestaña **"Odontograma"** como primera pestaña de la ficha (reemplaza "Resumo").
- Odontograma interactivo (`react-odontogram`, notación FDI) a la izquierda; panel de la
  pieza seleccionada a la derecha.
- Dientes coloreados por **estado de actividad** (Opción A): con realizado / con
  planificado / sin tratamientos.
- Panel derecho: historial de la pieza (todos los tratamientos), alta de tratamiento desde
  el catálogo, marcar planificado → realizado, eliminar planificado.
- Botón "Gerar orçamento": crea un `Quote` + `QuoteLine` a partir de los tratamientos
  planificados pendientes (no vinculados aún a un orçamento).

### Explícitamente fuera de alcance (siguientes fases)
- **Superficies / caras del diente** (mesial, oclusal…). Solo a nivel de pieza.
- **Estados clínicos por color** (ausente/implante/tratado como colores distintos, Opción
  B) y **símbolos clínicos** (diente ausente dibujado vacío, icono de implante, Opción C).
  v1 colorea solo por estado de actividad; extração/implante se leen en el panel al pinchar.
- Vinculación automática "realizado" ↔ consulta/agenda. En v1 se marca **a mano**.
- Selección por ítem al generar orçamento (v1 incluye todos los planificados pendientes).
- Dentición decidua (dientes de leche). v1 = dentición permanente (32 piezas, FDI).
- Edición de cabecera del orçamento (descuento, validez, método de pago) desde esta vista.

## 3. Modelo de datos

Una sola tabla nueva. Reusa `CatalogItem` (catálogo de tratamientos) y `Quote`/`QuoteLine`
(documento de orçamento) **sin modificarlos**.

```prisma
model ToothTreatment {
  id            String       @id @default(cuid())
  patientId     String
  toothFdi      String       // notación FDI, p. ej. "21"
  catalogItemId String?      // procedimiento del catálogo (SetNull si se borra)
  description   String       // snapshot del nombre del procedimiento
  priceCents    Int          // snapshot del precio en el momento del alta
  status        String       // "planned" | "done"
  quoteId       String?      // orçamento en el que entró (si se generó); SetNull
  completedAt   DateTime?    // fecha en que se marcó realizado
  patient       Patient      @relation(fields: [patientId], references: [id], onDelete: Cascade)
  catalogItem   CatalogItem? @relation(fields: [catalogItemId], references: [id], onDelete: SetNull)
  quote         Quote?       @relation(fields: [quoteId], references: [id], onDelete: SetNull)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}
```

Relaciones inversas a añadir: `Patient.toothTreatments`, `CatalogItem.toothTreatments`,
`Quote.toothTreatments`.

**Decisiones fundamentadas:**
- **`status` como `String`, no enum.** Coincide con el patrón ya usado en `Appointment`
  (`"scheduled"`, `"completed"`…). Valores: `"planned"` / `"done"`.
- **Snapshot de `description` + `priceCents`.** Igual que `QuoteLine`. El historial clínico
  debe sobrevivir a cambios o borrados del catálogo.
- **`QuoteLine` NO se modifica** (no se añade `toothFdi`). La pieza se embebe en la
  descripción de la línea ("Dente 21 — Restauração") y el vínculo real vive en
  `ToothTreatment.quoteId`. Un cambio de schema menos.
- **La extração→implante no necesita nada especial:** son dos filas `ToothTreatment` sobre
  el mismo `toothFdi` en fechas distintas. El historial de la pieza es esa lista ordenada.

### Estado de actividad del diente (derivado, para colorear)

Función pura sobre los tratamientos de una pieza:
- tiene alguno `done` → **realizado**
- si no, tiene alguno `planned` → **planejado**
- si no → **sem tratamento**

(Los tres se mapean a `outlineColor`/`fillColor` de `react-odontogram`; los tokens
concretos se fijan en implementación respetando rojo `#D32F2F` / gris.)

## 4. Arquitectura

```
prisma/schema.prisma                         # + model ToothTreatment, relaciones, migración
lib/patients/odontogram.ts                   # helpers puros: deriveToothActivity, buildQuoteDraft
lib/modules/tooth-treatments/service.ts      # list/add/markDone/remove/generateQuoteFromPlanned
app/(dashboard)/pacientes/[id]/actions.ts    # server actions que envuelven el servicio
components/patients/odontogram/
  odontogram-tab.tsx        # 'use client' — orquesta chart + panel, estado de pieza seleccionada
  odontogram-chart.tsx      # 'use client' — wrapper de react-odontogram (+ import del CSS)
  tooth-panel.tsx           # panel derecho: historial + alta + acciones
  add-treatment-picker.tsx  # selector de CatalogItem activo
components/patients/patient-detail.tsx        # renombra tab, monta la nueva pestaña, quita Resumo
lib/modules/patients/service.ts               # include: + toothTreatments en getPatientDetail
```

**Decisiones fundamentadas:**
- **La librería se aísla en `odontogram-chart.tsx`.** Todo lo demás (datos, panel, generar
  orçamento) es independiente de `react-odontogram`. Si v1 (Opción A) se queda corto y hay
  que subir a B/C, solo cambia ese archivo.
- **`'use client'` + import de `react-odontogram/style.css`** en el wrapper. Es un
  componente interactivo (hooks + clic).
- **Pestañas siguen siendo estado de cliente** (igual que el resto de la ficha): una sola
  query trae el detalle con `toothTreatments` incluidos.
- **Generar orçamento reusa `createQuote()`** de `lib/modules/quotes/service.ts` (ya
  genera el número `ORC-NNNNN` vía `nextQuoteNumber()` y crea las líneas). No se inventa
  numeración. `issueDate` en hora de Fortaleza (`lib/clinic-tz`).

## 5. Flujo de datos

1. `getPatientDetail(id)` trae el paciente con `toothTreatments` (orden por `createdAt`).
2. `odontogram-tab` deriva el mapa de color por pieza (`deriveToothActivity`) y lo pasa a
   `odontogram-chart` como `teethConditions`.
3. Clic en una pieza → `onChange` devuelve FDI/tipo → se selecciona; `tooth-panel` filtra
   los tratamientos de ese `toothFdi` y los lista (realizados + planificados).
4. **Adicionar tratamento:** elige `CatalogItem` activo → server action crea
   `ToothTreatment` (`status="planned"`, snapshot de nombre/precio) → revalida.
5. **Marcar realizado:** server action pone `status="done"`, `completedAt=now` → revalida.
6. **Gerar orçamento:** toma los `ToothTreatment` del paciente con `status="planned"` y
   `quoteId=null`; construye `QuoteLineInput[]` (descripción "Dente {fdi} — {description}",
   `quantity=1`, `unitPriceCents` del snapshot) y llama a `createQuote()`; luego enlaza
   `quoteId` del orçamento creado en esos tratamientos (en transacción) → aparece en la
   pestaña Orçamentos.

## 6. Manejo de errores / casos límite
- **Paciente sin tratamientos:** odontograma todo neutro; panel sin pieza seleccionada
  muestra "Selecione um dente".
- **Pieza sin tratamientos:** panel muestra solo "+ Adicionar tratamento".
- **Catálogo vacío / ítem borrado:** el picker muestra solo `isActive`; el snapshot
  garantiza que el historial no se rompe si luego se borra el ítem.
- **Gerar orçamento sin planificados pendientes:** botón deshabilitado.
- **Planificado ya presupuestado** (`quoteId != null`): sigue como `planned`, pero queda
  excluido de la próxima generación (filtro `quoteId == null`) para no duplicarlo.

## 7. Pruebas
- `lib/patients/odontogram.ts` (puro, vitest):
  - `deriveToothActivity`: realizado > planejado > sem tratamento, según los tratamientos.
  - `buildQuoteDraft`: planificados pendientes → líneas correctas (descripción con FDI,
    precios snapshot) y total.
- Servicio: `generateQuoteFromPlanned` excluye los ya vinculados (`quoteId != null`).
