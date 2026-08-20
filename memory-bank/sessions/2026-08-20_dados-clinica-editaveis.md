# Session: Dados da clínica editáveis desde Configurações
Date: 2026-08-20 15:38
Project: lia-web

## Goal
El Dr. Darcy reportó por WhatsApp que un atestado real salió impreso con dirección, teléfono
y site equivocados. Averiguar de dónde salen esos datos y dejar una vía para corregirlos sin
deploy.

## Decisions
- **La capa PDF no tenía nada que arreglar.** Auditados los tres documentos: los siete campos
  de clínica ya venían de `clinic` (fila de BD) vía `SignatureBox` y `PdfFooter`, y las tres
  rutas los cargan con `getClinicProfile()`. Lo único hardcodeado son las dos taglines de
  orçamento/receita, el logo y los textos de plantilla — ninguno es un dato de clínica.
- **`update`, no `upsert`.** Se consultó Neon antes de escribir el escritor: la fila `default`
  existe (creada 2026-06-01) con los placeholders del seed. Con la fila garantizada, un
  `update` calcado de `updateClinicSchedule` basta; el `upsert` habría obligado a inventar un
  valor para `subtitle` en la rama `create`.
- **Validación devuelta, no lanzada.** `requiredText` de `lib/forms.ts` lanza excepción, y una
  excepción dentro de un server action es exactamente el recuadro rojo "An error occurred in
  the Server Components render" que el doctor ve en otra pantalla. El action recolecta con
  `textValue` y devuelve `{status,message}` como el de horario.
- **`subtitle` fuera del formulario.** Está en BD pero no se imprime en ningún PDF. Meterlo
  sería exponer un campo sin efecto; borrarlo no se pidió. Se deja como está.
- **Sin leyendas de relleno.** Se copió de `ScheduleForm` un texto de ayuda en reposo
  («Exatamente como deve sair impresso.»); el usuario lo rechazó junto con el original
  («Intervalos de 15 minutos.»). Ambos `<p aria-live>` quedan vacíos en reposo — el elemento
  existe para anunciar éxito/error, no para llevar copy.

## Work Done
- `updateClinicProfile(data)` en `lib/clinic/profile.ts` + tipo `ClinicProfileInput` (7 campos).
- `updateClinicProfileAction` en `configuracoes/actions.ts`: permiso `settings:update`,
  campos requeridos con nombre en el mensaje de error, `revalidatePath("/configuracoes")`.
- `clinic-profile-form.tsx`: sección "Dados da clínica" calcando la rejilla, el tile de icono,
  la etiqueta mono 11px y el botón de `ScheduleForm`. Mono solo en CRO y teléfono (son datos).
- Montada encima de "Expediente padrão" en `configuracoes/page.tsx`.
- Verificado: lint 0 errores, 53/53 tests, `pnpm build` completo.

## Learnings
- **El síntoma señalaba al PDF y la causa estaba en el seed.** `prisma/seed.ts:96-125` hace
  `upsert` con `update:` poblado de placeholders (`CLINIC_*` con fallback), y el `.env` de
  producción no define ninguna `CLINIC_*`. Es decir: **cada `pnpm db:seed` pisa los datos
  reales de la clínica con los de ejemplo.** No se tocó (fuera del alcance pedido), pero es
  una bomba: en cuanto alguien escriba los datos buenos, el siguiente seed los borra.
- El respaldo hardcodeado de `getClinicProfile()` (líneas 6-20) repite exactamente los mismos
  placeholders que el seed, así que "fila con placeholders" y "fila inexistente" producen un
  PDF idéntico. Imposible distinguirlos sin consultar la BD.
- El único dato real de la clínica en todo el ecosistema vive en el prompt del agente:
  `agente-LIA/src/prompts/lia-core.ts:17` (dirección sin CEP). El teléfono (85) 9977-1454 de
  `system-prompt-lia.ts:152` es el móvil personal del doctor, no el institucional.
- `node_modules` no estaba instalado al arrancar; sin él no hay forma de consultar la BD ni de
  verificar nada. `npx tsc --noEmit` en frío da tres errores `RouteContext` en las rutas de
  PDF que desaparecen tras `next build` — son typegen ausente, no errores reales.

## Key Files
lib/clinic/profile.ts
app/(dashboard)/configuracoes/actions.ts
app/(dashboard)/configuracoes/clinic-profile-form.tsx
app/(dashboard)/configuracoes/page.tsx
app/(dashboard)/configuracoes/schedule-form.tsx
prisma/seed.ts
lib/pdf/footer.tsx
lib/pdf/signature-box.tsx
