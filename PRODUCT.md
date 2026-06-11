# Product

## Register

product

## Users

El **Dr. Darcy** (dentista) y la **recepción** de su clínica, en Fortaleza (Brasil).
Lo usan durante la jornada, en el consultorio:

- El dentista trabaja lo **clínico**: odontograma, plan de tratamiento, historial de la pieza.
- Recepción trabaja lo **operativo**: agenda, alta de pacientes, orçamentos, recetas, atestados.

UI en **portugués (PT-BR)**. Un usuario a la vez por pantalla; consultas rápidas frecuentes
(buscar un paciente, ver el día) intercaladas con trabajo de foco (planificar tratamiento).

## Product Purpose

**Lia** es el sistema de gestión de una clínica dental única. Reúne en una sola herramienta
calma lo que hoy vive disperso: agenda (semana/día/mes con arrastrar y soltar), ficha de
pacientes, odontograma + plan de tratamiento, orçamentos, receitas, atestados y catálogo de
procedimientos. Un agente de IA (teléfono/WhatsApp) agenda citas contra la misma base.

Éxito = el equipo lleva el día con menos clics que con su flujo anterior, lo clínico y lo
administrativo conviven sin fricción, y nada en pantalla distrae del dato que importa.

## Brand Personality

**Instrumento clínico de precisión.** Sobrio, sereno, de confianza. El dato es el héroe; la
interfaz se aparta. Tres palabras: **preciso, sobrio, fiable**.

Voz: directa, en PT-BR, sin adornos ni jerga de marketing. Etiquetas que dicen qué pasa
("Nova consulta", "Gerar orçamento"), nunca "OK" ni floritura.

## Anti-references

Rechazadas explícitamente por el usuario, las cuatro a la vez:

- **SaaS genérico** — dashboards azul/morado, tarjetas todas iguales, estética de plantilla.
- **Software médico anticuado** — denso, gris, tablas feas tipo sistema hospitalario viejo.
- **App de consumo juguetona** — colores chillones, ilustraciones, tono lúdico.
- **Lujo / editorial recargado** — serif elegante, mucho aire de revista; bonito pero lento.

## Design Principles

1. **El dato manda.** Números y hechos clínicos son protagonistas (mono, `tabular-nums`);
   el cromado retrocede. Si algo no informa, no ocupa espacio.
2. **El rojo es señal escasa.** `#d32f2f` solo donde significa: hoy, acción primaria, estado
   activo. El color porta información, jamás decora. El estado clínico nunca depende solo del
   color (siempre va con etiqueta/icono).
3. **Calma densa.** Rica en información pero nunca apretada ni ruidosa: el espacio en blanco
   y las líneas de pelo (hairlines) hacen la estructura, no las cajas ni las sombras.
4. **Nativo, no pegado.** Cada feature nueva hereda el idioma de la agenda al pie de la letra.
   Nada debe parecer importado de otra librería o plantilla.
5. **Velocidad de uso.** El mínimo de clics, sin fricción decorativa. La herramienta sirve al
   trabajo, no al revés.

## Accessibility & Inclusion

- **Light + dark** (ya implementados; ambos son ciudadanos de primera).
- Contraste objetivo **WCAG AA** (cuerpo ≥ 4.5:1). Cuidado especial con texto mono pequeño
  sobre fondos tintados.
- **Reduced motion:** toda animación tiene alternativa (crossfade/instantáneo).
- **El color nunca es el único portador** de un estado clínico: acompañar siempre de
  etiqueta o icono (crítico en el odontograma, por daltonismo).
