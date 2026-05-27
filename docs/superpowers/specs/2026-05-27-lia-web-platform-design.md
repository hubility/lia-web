# Lia Web Platform Design

## Objetivo

Construir la plataforma web operacional del consultorio del Dr. Darcy Mavignier para que el equipo gestione pacientes, agenda, presupuestos, recetas, atestados, catálogo y usuarios. La misma plataforma expone una API privada con clave de API para que un consumidor automatizado pueda operar sobre los datos del consultorio sin acceder directamente a la base de datos.

La entrega es una versión final funcional: datos reales en PostgreSQL, autenticación real, permisos reales, CRUD real y generación real de PDFs. No se incluyen mocks, datos falsos, botones decorativos ni placeholders.

## Alcance Funcional

La plataforma incluye estos módulos:

- Autenticación web.
- Usuarios y roles.
- Pacientes/clientes.
- Agenda/consultas.
- Catálogo de procedimientos/servicios.
- Presupuestos odontológicos.
- Recetas odontológicas.
- Atestados odontológicos.
- API privada con API key.
- Generación y descarga de PDFs.

El agente conversacional no forma parte de esta implementación. La API privada sí forma parte de esta implementación y debe quedar operativa para cualquier cliente autorizado por API key.

## Tecnología Base

- App: Next.js 16 en `lia-web`.
- UI: App Router + React 19 + Tailwind CSS 4.
- Base de datos: PostgreSQL local, database `lia`.
- ORM: Prisma.
- Lenguaje: TypeScript.
- PDFs: generación server-side desde datos persistidos.

Antes de implementar código de Next.js 16 se debe consultar la documentación local indicada en `AGENTS.md`, porque esta versión puede tener cambios de API y estructura respecto a versiones anteriores.

## Autenticación Web

La plataforma requiere login para acceder al panel. No hay acceso anónimo a las pantallas operativas.

Cada usuario humano tiene:

- Nombre.
- Email.
- Contraseña.
- Rol.
- Estado activo/inactivo.

La autenticación usa sesiones web. Las rutas del panel validan sesión antes de renderizar datos o ejecutar acciones.

## Roles y Permisos

Hay tres roles:

- `admin`
- `dentist`
- `assistant`

Permisos:

| Recurso | admin | dentist | assistant |
| --- | --- | --- | --- |
| Usuarios | CRUD | Sin acceso | Sin acceso |
| Catálogo | CRUD | Lectura | Lectura |
| Pacientes | CRUD | CRUD | CRUD |
| Agenda/consultas | CRUD | CRUD | CRUD |
| Presupuestos | CRUD | CRUD | CRUD |
| Recetas | CRUD | CRUD | CRUD |
| Atestados | CRUD | CRUD | CRUD |

No hay permisos más granulares dentro de cada módulo. Si un rol tiene CRUD sobre un recurso, puede crear, listar, ver detalle, editar y eliminar registros de ese recurso.

## API Privada

La API privada se autentica con API key. La clave se envía en el header `x-api-key`.

La API no usa sesión web. Una API key válida permite acceder a endpoints operativos, pero no permite administrar usuarios ni modificar el catálogo.

Capacidades de API:

- Buscar, crear, consultar, editar y eliminar pacientes.
- Listar catálogo.
- Consultar agenda.
- Crear, consultar, editar y eliminar consultas.
- Crear, consultar, editar y eliminar presupuestos.
- Generar y consultar PDF de presupuesto.
- Crear, consultar, editar y eliminar recetas.
- Generar y consultar PDF de receta.
- Crear, consultar, editar y eliminar atestados.
- Generar y consultar PDF de atestado.

La API llama la misma lógica de dominio que la web. No debe existir una implementación separada con reglas distintas.

## Modelo de Datos

### User

Representa un usuario humano del consultorio.

Campos:

- `id`
- `name`
- `email`
- `passwordHash`
- `role`
- `isActive`
- `createdAt`
- `updatedAt`

Reglas:

- El email es único.
- Solo `admin` gestiona usuarios.
- Usuarios inactivos no pueden iniciar sesión.

### ApiKey

Representa una clave de acceso para la API privada.

Campos:

- `id`
- `name`
- `keyHash`
- `isActive`
- `lastUsedAt`
- `createdAt`
- `updatedAt`

Reglas:

- La clave real no se guarda en texto plano.
- Solo se validan claves activas.

### Patient

Representa un cliente/paciente.

Campos:

- `id`
- `name`
- `phone`
- `email`
- `cpf`
- `birthDate`
- `recordNumber`
- `notes`
- `createdAt`
- `updatedAt`

Reglas:

- `name` y `phone` son obligatorios.
- `cpf`, `email`, `birthDate`, `recordNumber` y `notes` son opcionales.
- La ficha del paciente muestra consultas, presupuestos, recetas y atestados asociados.

### CatalogItem

Representa un procedimiento o servicio odontológico.

Campos:

- `id`
- `name`
- `description`
- `price`
- `durationMinutes`
- `isActive`
- `createdAt`
- `updatedAt`

Reglas:

- Solo `admin` crea, edita y elimina ítems.
- `dentist` y `assistant` pueden leer el catálogo para usarlo en consultas y presupuestos.
- Los ítems inactivos no aparecen como opción nueva, pero los registros históricos que los usen siguen mostrando su información guardada.

### Appointment

Representa una consulta en agenda.

Campos:

- `id`
- `patientId`
- `catalogItemId`
- `title`
- `startsAt`
- `durationMinutes`
- `status`
- `notes`
- `createdAt`
- `updatedAt`

Estados:

- `scheduled`
- `confirmed`
- `cancelled`
- `completed`

Reglas:

- Toda consulta pertenece a un paciente.
- Puede estar vinculada a un ítem de catálogo.
- `title` permite describir consultas que no encajan exactamente con un procedimiento del catálogo.
- La agenda debe permitir crear, editar, cancelar, concluir y eliminar consultas.

### Quote

Representa un presupuesto odontológico.

Campos:

- `id`
- `patientId`
- `number`
- `issueDate`
- `paymentMethod`
- `validityDays`
- `discountAmount`
- `notes`
- `createdAt`
- `updatedAt`

Líneas de presupuesto:

- `id`
- `quoteId`
- `catalogItemId`
- `description`
- `quantity`
- `unitPrice`
- `totalPrice`

Reglas:

- Todo presupuesto pertenece a un paciente.
- Cada línea puede venir del catálogo o ser manual.
- El total se calcula desde las líneas menos descuento.
- El número de presupuesto debe ser único y legible.
- El PDF se genera desde el presupuesto persistido.

### Prescription

Representa una receta odontológica.

Campos:

- `id`
- `patientId`
- `issueDate`
- `notes`
- `createdAt`
- `updatedAt`

Ítems de receta:

- `id`
- `prescriptionId`
- `medicine`
- `instructions`
- `position`

Reglas:

- Toda receta pertenece a un paciente.
- Una receta tiene uno o más ítems.
- El PDF se genera desde la receta persistida.

### MedicalCertificate

Representa un atestado odontológico.

Campos:

- `id`
- `patientId`
- `issueDate`
- `absenceStartDate`
- `absenceEndDate`
- `cid`
- `city`
- `notes`
- `createdAt`
- `updatedAt`

Reglas:

- Todo atestado pertenece a un paciente.
- El texto del atestado se genera con los datos guardados.
- El PDF se genera desde el atestado persistido.

## Pantallas

### Login

Formulario con email y contraseña.

Comportamiento:

- Login correcto abre el panel.
- Login incorrecto muestra error claro.
- Usuario inactivo no puede entrar.

### Panel Base

Layout con navegación lateral:

- Agenda.
- Pacientes.
- Presupuestos.
- Recetas.
- Atestados.
- Catálogo.
- Usuarios.

Catálogo y Usuarios se muestran como secciones administrativas. Si un usuario no tiene permiso para operar la sección, no puede acceder a sus acciones.

### Agenda

Vista principal inspirada en el prototipo `lia-agenda.html`, con marca corregida a Lia y Dr. Darcy.

Debe permitir:

- Ver consultas.
- Crear consulta.
- Editar consulta.
- Cancelar consulta.
- Marcar consulta como concluida.
- Eliminar consulta.
- Asociar paciente.
- Asociar procedimiento del catálogo.

La agenda debe ser usable en desktop. No se requiere una experiencia móvil completa para esta entrega.

### Pacientes

Debe permitir:

- Listar pacientes.
- Buscar por nombre, teléfono, CPF o email.
- Crear paciente.
- Ver ficha del paciente.
- Editar paciente.
- Eliminar paciente.

La ficha del paciente muestra:

- Datos del paciente.
- Consultas asociadas.
- Presupuestos asociados.
- Recetas asociadas.
- Atestados asociados.

### Catálogo

Debe permitir al `admin`:

- Listar procedimientos/servicios.
- Crear ítem.
- Editar ítem.
- Activar/inactivar ítem.
- Eliminar ítem si no rompe registros existentes.

Debe permitir a `dentist` y `assistant`:

- Consultar ítems activos desde formularios de consultas y presupuestos.

### Presupuestos

Debe permitir:

- Listar presupuestos.
- Crear presupuesto.
- Añadir líneas desde catálogo.
- Añadir líneas manuales.
- Editar presupuesto.
- Eliminar presupuesto.
- Ver detalle.
- Generar/descargar PDF.

### Recetas

Debe permitir:

- Listar recetas.
- Crear receta.
- Añadir medicamentos e instrucciones.
- Editar receta.
- Eliminar receta.
- Ver detalle.
- Generar/descargar PDF.

### Atestados

Debe permitir:

- Listar atestados.
- Crear atestado.
- Editar atestado.
- Eliminar atestado.
- Ver detalle.
- Generar/descargar PDF.

### Usuarios

Solo `admin`.

Debe permitir:

- Listar usuarios.
- Crear usuario.
- Editar usuario.
- Cambiar contraseña.
- Activar/inactivar usuario.
- Eliminar usuario si no rompe integridad de datos.

## PDFs

Los PDFs se generan en backend desde los datos persistidos. No se rellenan desde datos temporales de pantalla.

Identidad visual:

- Marca Dr. Darcy Mavignier.
- Rojo institucional `#D32F2F`.
- Gris institucional.
- Tipografía institucional Montserrat cuando esté disponible.
- Layout limpio de documento clínico.

Datos del consultorio:

- Nombre: Dr. Darcy Mavignier.
- Especialidad: Cirurgião-Dentista.
- CRO: CRO-CE 4157.

Los datos de teléfono, dirección, web y logo deben configurarse como datos del consultorio en la aplicación para que los PDFs no dependan de texto hardcoded disperso.

### PDF de Presupuesto

Incluye:

- Título `ORÇAMENTO ODONTOLÓGICO`.
- Fecha.
- Número de presupuesto.
- Paciente.
- Teléfono.
- CPF.
- Prontuario.
- Tabla de ítems: descripción, cantidad, valor unitario, valor total.
- Subtotal.
- Descuento.
- Total.
- Forma de pago.
- Validez.
- Observaciones.
- Bloque de firma.
- Pie institucional.

### PDF de Receta

Incluye:

- Título `RECEITA ODONTOLÓGICA`.
- Fecha.
- Paciente.
- Edad.
- Prontuario.
- Lista numerada de medicamentos e instrucciones.
- Observaciones.
- Bloque de firma.
- Pie institucional.

### PDF de Atestado

Incluye:

- Título `ATESTADO ODONTOLÓGICO`.
- Texto declarativo para fines trabalhistas.
- Nombre del paciente.
- Período de afastamento.
- CID.
- Ciudad y fecha.
- Nombre del dentista.
- Especialidad.
- CRO.
- Bloque de firma.

## Validaciones y Errores

Validaciones mínimas:

- Login requiere email y contraseña.
- Paciente requiere nombre y teléfono.
- Catálogo requiere nombre, precio y duración.
- Consulta requiere paciente, inicio y duración.
- Presupuesto requiere paciente y al menos una línea.
- Receta requiere paciente y al menos un ítem.
- Atestado requiere paciente, fechas de afastamento, ciudad y fecha de emisión.

Errores:

- Formularios muestran mensajes claros junto al campo.
- API devuelve JSON con error legible y status HTTP correcto.
- Acceso sin sesión devuelve redirección al login.
- Acceso web sin permiso devuelve pantalla de acceso denegado.
- API key inválida devuelve `401`.

## Estructura Propuesta

```text
app/
  (auth)/
    login/
  (dashboard)/
    agenda/
    pacientes/
    catalogo/
    orcamentos/
    receitas/
    atestados/
    usuarios/
  api/
    agent/
      v1/
    pdf/
lib/
  auth/
  db/
  permissions/
  modules/
    users/
    patients/
    catalog/
    appointments/
    quotes/
    prescriptions/
    certificates/
    pdf/
prisma/
  schema.prisma
```

## Criterios de Aceptación

- La app conecta con PostgreSQL local database `lia`.
- Un usuario puede iniciar y cerrar sesión.
- Los permisos por rol se cumplen.
- `admin` puede gestionar usuarios y catálogo.
- `dentist` y `assistant` no pueden gestionar usuarios ni modificar catálogo.
- Todos los roles pueden hacer CRUD de pacientes, agenda, presupuestos, recetas y atestados según su permiso definido.
- La API privada rechaza requests sin API key válida.
- La API privada puede operar sobre pacientes, agenda, presupuestos, recetas y atestados.
- Presupuestos generan PDF real.
- Recetas generan PDF real.
- Atestados generan PDF real.
- No hay datos mock en pantallas operativas.
- No hay botones visibles sin funcionalidad real.
- La marca del panel usa `Lia`, no `Olivia`.
