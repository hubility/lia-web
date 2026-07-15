# Design

Sistema visual de **Lia**, extraído del código real de la agenda (`app/globals.css`,
`components/agenda/*`). La agenda es la **única referencia de estilo** del sistema; toda
vista nueva la calca. Light y dark son ambos de primera clase.

## Theme

Claro por defecto: blanco cálido, tinta casi negra, una sola señal roja. Sensación de
aparato de precisión en una mesa bien iluminada — sereno, denso, sin ruido. El oscuro es el
mismo instrumento de noche, no un tema distinto.

## Color

Tokens en `app/globals.css` (HEX; el sistema NO usa OKLCH — respetar lo existente).

**Light**
- `--background` `#fafaf7` (blanco cálido, NO blanco puro)
- `--foreground` `#0c0c14` (tinta casi negra)
- `--card` `#ffffff` · `--border`/`--input` `#e4e4e0` (hairline) · `--secondary` `#e8e8e3`
- `--muted` `#f0f0ec` · `--muted-foreground` `#71717a`
- `--primary` `#d32f2f` (rojo) · `--accent` `#b71c1c` · `--ring` `#d32f2f`
- Semánticos: `--success` `#059669` · `--info` `#2563eb` · `--destructive` `#dc2626`

**Dark**
- `--background` `#0c0c14` · `--foreground` `#fafaf7` · `--card` `#14141c`
- `--border` `#27272f` · `--secondary` `#1f1f28` · `--muted-foreground` `#a1a1aa`
- `--primary` `#ef4444` (rojo aclarado) · `--success` `#10b981` · `--info` `#3b82f6`

**Paleta de datos** (`--chart-1..8`): solo para codificar categorías (colores de
procedimiento, estados). Se aplican como acento, nunca como relleno de superficie. Selección
determinista por hash en `lib/agenda/colors.ts` (`procedureColorVar`).

**Reglas de color (no negociables):**
- El rojo (`--primary`) es **señal escasa**: hoy, acción primaria, estado activo/seleccionado.
  Nunca como relleno decorativo ni como "estado clínico" genérico.
- Lavados de marca con alfa muy bajo: `bg-primary/3` (hoy), `bg-primary/5` (hover/drop).
- Verde `--success` = realizado/confirmado; azul `--info` = informativo/planificado.
- Contraste cuerpo ≥ 4.5:1. Ojo con mono pequeño sobre tintados; subir hacia `--foreground`
  antes que "gris elegante".

## Typography

Dos familias (`app/globals.css` → `@theme`), sin una tercera:
- **Outfit** (`--font-sans`): cuerpo, nombres, títulos, botones.
- **JetBrains Mono** (`--font-mono`): TODO dato — horas, fechas, duraciones, contadores,
  números de ficha, etiquetas de sección.

Patrones reales observados:
- **Etiqueta mono:** `font-mono text-[11px] font-semibold uppercase tracking-wider
  text-muted-foreground`. Es la firma del sistema (cabeceras de día, labels de tarjeta).
- **Cifras:** siempre `tabular-nums`. Números grandes destacan por **peso ligero**, no por
  grito: día del mes = `font-mono text-2xl font-light`.
- **Cuerpo/nombre:** `text-sm`/`text-base font-medium text-foreground` en Outfit.
- Contraste de jerarquía por **peso** (bold mono diminuto ↔ light grande), no por escalas
  enormes. Sin all-caps en cuerpo (solo en etiquetas mono).

## Spacing, radius, elevation

- `--radius` `0.5rem`; escala `radius-sm/md/lg/xl`. Las tarjetas usan `rounded-md`.
- Ritmo en múltiplos de 4 (`gap-0.5/1/2/3/4`, `px-2 py-1` denso, `px-3 py-2/3` cómodo).
- Elevación mínima: `shadow-sm` en reposo, `hover:shadow-md`, `shadow-lg` al arrastrar.
  **Sin** gradientes, **sin** glassmorphism, **sin** sombras dramáticas.
- Estructura por **hairlines** (`border-border`) y rejilla, no por cajas pesadas.

## Components

- **Tarjeta:** `rounded-md border bg-card shadow-sm`, borde `border/60`. Contenedor calmo.
- **Cita de agenda:** borde completo y tinte mínimo derivados del color de procedimiento;
  nunca stripe lateral. En bloques cortos, hora + paciente en una línea. El tipo de consulta
  aparece cuando el ancho o el alto reales lo permiten.
- **Segmented control** (DIA/SEMANA/MÊS, pestañas): pista `bg-secondary p-0.5 rounded-md`;
  activo `bg-card text-foreground shadow-sm`; inactivo `text-muted-foreground hover:text-foreground`.
  Items mono, uppercase, `tracking-wider`, `text-xs`.
- **Botón primario:** `bg-primary text-primary-foreground rounded-md`, `font-semibold`,
  `hover:opacity-90`, icono Hugeicons + texto (verbo + objeto: "Nova consulta").
- **Botón icono:** `h-8 w-8 grid place-items-center rounded-md text-muted-foreground
  hover:bg-secondary hover:text-foreground`.
- **Fila de lista:** `flex items-center justify-between border-b px-3 py-2.5 last:border-b-0`;
  título Outfit + meta mono muted; estados cancelados con `opacity-50 line-through`.
- **Sheet** lateral para alta/edición (crear/editar sin abandonar la vista).
- **Iconos:** Hugeicons, `strokeWidth 1.75–2`, `size 14–16`. Trazo fino y consistente.

## Motion

- Tokens: `--duration-fast 120ms`, `--base 200ms`, `--slow 320ms`;
  `--ease-out cubic-bezier(0.16,1,0.3,1)`, `--ease-in-out cubic-bezier(0.65,0,0.35,1)`.
- Transiciones sobre color/sombra/opacidad. Hover = elevación de sombra. Ease-out, sin
  rebote ni elástico. Micro-interacciones, nunca espectáculo.
- Ghost de arrastre: borde discontinuo `border-primary/50` sobre `bg-primary/5`.
- `prefers-reduced-motion`: alternativa obligatoria (crossfade/instantáneo).

## Agenda responsive

- Día y semana ocupan el alto restante del shell. La escala temporal se calcula desde el
  alto real del contenedor; no existe un `PX_PER_HOUR` global de presentación.
- `56px` por hora es únicamente el suelo de legibilidad. Por debajo, la línea temporal hace
  scroll vertical; por encima, las horas se expanden para aprovechar el viewport.
- La semana conserva un ancho mínimo legible por día y usa scroll horizontal. La cabecera
  de días y el canal horario permanecen fijos dentro del mismo plano de scroll.
- Posición, hover, resize y drag-and-drop comparten la misma escala medida. Nunca calcular
  la interacción con una métrica diferente de la usada para dibujar.
- La densidad de una cita depende del tamaño renderizado del bloque, no solo de la vista.
  El paciente tiene prioridad sobre intervalo, duración y título.

## Anti-patterns (prohibido en vistas nuevas)

- **Borde-acento lateral > 1px** como decoración. Usar borde completo, tinte de fondo o
  icono/numeral para comunicar categoría o estado.
- Texto en gradiente, glassmorphism decorativo, sombras dramáticas, gradientes de fondo.
- Tarjetas anidadas. Rejillas de tarjetas idénticas. Eyebrow mono en cada sección "porque sí".

## Odontograma (color de pieza — específico de la feature)

Codificación por **estado de actividad**, color + etiqueta (nunca solo color):
- realizado → `--success` (verde)
- planejado → `--info` (azul)
- sem tratamento → contorno `--border` neutro
- pieza **seleccionada** → ring `--primary` (rojo, señal de foco)

El rojo se reserva para selección/acción; no significa estado clínico.
