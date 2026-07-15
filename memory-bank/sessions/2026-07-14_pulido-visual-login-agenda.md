# Session: Pulido visual UI/UX — login rediseñado, agenda revertida
Date: 2026-07-14 20:37
Project: lia-web

## Goal
Mejorar el acabado visual y la UX del app (login, agenda, pacientes) vista por vista,
empezando por login. Mejora puramente de UI/UX, sin inventar backend ni funcionalidades.

## Decisions
- Trabajo **vista por vista**, empezando por login (la peor, win contenido).
- Login: composición "ficha centrada" (elegida entre 3 opciones), 100% on-system. Se
  descartó el patrón "panel lateral rojo" porque DESIGN.md exige rojo como señal escasa
  (nunca relleno decorativo).
- Se quitó "Painel Dr. Darcy" del login: el logo ya dice "Dr. Darcy Mavignier" (redundante);
  queda eyebrow mono "ACESSO" + título "Painel clínico".
- Salvedad conocida: el logo PNG trae wordmark rojo-oscuro/gris para fondo claro; en dark
  el texto pierde contraste. Se dejó así (el ícono carga la marca); no se aplican filtros
  CSS sobre raster. Pendiente eventual variante mono/clara.

## Work Done
- **Login rediseñado y commiteado** (`b1b1578`): `page.tsx` + `login-form.tsx` migrados de
  zinc/red-700 crudos a tokens del sistema, logo real (`logoDarcy.png` vía next/image),
  labels mono uppercase, foco con anillo `--ring`, errores con `--destructive`, dark mode.
  Typecheck + lint limpios.
- **Agenda: intento de "contenedor" REVERTIDO.** Se probó envolver el calendario en
  `rounded-lg border bg-card shadow-sm` + cerrar bordes de rejilla. El usuario lo rechazó
  de plano ("no puede ser más AI slop"). Revertidos los 5 archivos a estado original
  (no commiteados). La agenda queda intacta.
- Branch `feat/pulido-visual-ui` creado; contiene SOLO el login.

## Learnings
- **Error de la sesión:** intenté "arreglar" la sensación de inacabado de la agenda
  envolviéndola en un contenedor con borde + sombra y cerrando los bordes de rejilla. El
  usuario lo rechazó de plano ("no puede ser más AI slop") y se revirtió. Añadir una
  superficie contenedora NO es pulido en este sistema — choca con DESIGN.md (hairlines/
  rejilla, no cajas; sin sombras). Esto acota QUÉ no hacer; NO significa que la agenda esté
  terminada: el usuario sigue queriéndola mejorar, por otra vía (contraste/ritmo/densidad/
  micro-detalle), no con superficies nuevas.
- Problemas reales de la agenda identificados pero SIN validar aún con el usuario (no dar
  por buenos sin su OK): tarjeta densa que corta el nombre a 30min (PX_PER_HOUR=48);
  ventana fija 08–18 que podría ocultar citas fuera de rango; sin línea de "ahora"; semana
  de 6 columnas fijas sin fallback responsive (sidebar `hidden md:flex` = sin nav en móvil).
- El usuario prefiere iterar en el app real y validar cada micro-cambio antes de avanzar,
  no recibir planes grandes ni conclusiones presuntuosas.

## Key Files
app/(auth)/login/page.tsx
app/(auth)/login/login-form.tsx
