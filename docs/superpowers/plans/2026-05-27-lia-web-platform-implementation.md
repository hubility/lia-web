# Lia Web Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Lia web platform for Dr. Darcy's clinic: authenticated role-based web CRUD, private API-key API, PostgreSQL persistence, and PDF generation for budgets, prescriptions, and medical certificates.

**Architecture:** Use a single Next.js 16 App Router application backed by PostgreSQL through Prisma. Web forms use Server Actions and shared domain services; API routes use the same services behind API-key authentication. PDF routes generate server-side documents from persisted records.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, PostgreSQL local database `lia`, Prisma, Zod, bcryptjs, Node crypto sessions, @react-pdf/renderer, Vitest.

---

## Scope Lock

Implement only the approved scope from `docs/superpowers/specs/2026-05-27-lia-web-platform-design.md`:

- Web auth with multiple users.
- Roles: `admin`, `dentist`, `assistant`.
- `admin`: users CRUD, catalog CRUD, and all clinical/commercial CRUD.
- `dentist` and `assistant`: patients, appointments, quotes, prescriptions, and certificates CRUD.
- Catalog is readable by `dentist` and `assistant`.
- PostgreSQL local database `lia`.
- API private access with `x-api-key`.
- Real PDFs for quotes, prescriptions, and certificates.
- No fake operational data and no visible non-functional controls.

## File Structure Map

Create or modify these areas:

```text
app/
  (auth)/login/page.tsx                 # Login route
  (auth)/login/login-form.tsx           # Client form with useActionState
  (dashboard)/layout.tsx                # Protected shell and nav
  (dashboard)/page.tsx                  # Redirect to agenda
  (dashboard)/agenda/*                  # Appointment list/form/detail actions
  (dashboard)/pacientes/*               # Patient list/form/detail actions
  (dashboard)/catalogo/*                # Admin catalog CRUD
  (dashboard)/orcamentos/*              # Quote CRUD and PDF links
  (dashboard)/receitas/*                # Prescription CRUD and PDF links
  (dashboard)/atestados/*               # Certificate CRUD and PDF links
  (dashboard)/usuarios/*                # Admin user CRUD
  api/agent/v1/*                        # API-key JSON endpoints
  api/pdf/orcamentos/[id]/route.ts      # Session-protected quote PDF
  api/pdf/receitas/[id]/route.ts        # Session-protected prescription PDF
  api/pdf/atestados/[id]/route.ts       # Session-protected certificate PDF
components/
  app-shell.tsx                         # Dashboard layout UI
  field.tsx                             # Shared form field rendering
  empty-state.tsx                       # Empty table/list state
  submit-button.tsx                     # Pending-aware submit button
lib/
  auth/*                                # Password, sessions, API keys, guards
  db/prisma.ts                          # Prisma singleton
  permissions.ts                        # Role capability checks
  forms.ts                              # Form state helpers
  money.ts                              # BRL parsing/formatting
  dates.ts                              # Date parsing/formatting helpers
  http.ts                               # API JSON helpers
  clinic/profile.ts                     # Dr. Darcy clinic profile loader
  modules/*                             # Domain services, schemas, actions
  pdf/*                                 # Shared PDF theme and document renderers
prisma/
  schema.prisma                         # Database schema
  seed.ts                               # Initial admin, API key, clinic profile
tests/
  permissions.test.ts
  auth.test.ts
  modules/*.test.ts
  api/*.test.ts
  pdf/*.test.ts
```

## Conventions

- Every Server Action must call an auth/permission guard inside the action.
- Every API route must validate `x-api-key`.
- Domain services return persisted data or throw typed application errors.
- Pages should stay thin: load data, render components, call actions.
- Forms use Zod schemas on the server.
- Prices are stored as integer cents.
- Dates are stored as `DateTime` in PostgreSQL; user-facing labels use local formatting.
- Deletions are hard deletes unless referential integrity requires inactivation.
- Run `pnpm lint`, `pnpm test`, and `pnpm build` before final completion.

---

### Task 1: Dependencies, Scripts, and Environment Contract

**Files:**
- Modify: `package.json`
- Create: `.env.example`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `tests/smoke.test.ts`

- [ ] **Step 1: Install runtime dependencies**

Run:

```powershell
pnpm add @prisma/client zod bcryptjs @react-pdf/renderer lucide-react clsx
```

Expected: dependencies added to `package.json` and `pnpm-lock.yaml`.

- [ ] **Step 2: Install development dependencies**

Run:

```powershell
pnpm add -D prisma vitest tsx @types/bcryptjs
```

Expected: dev dependencies added.

- [ ] **Step 3: Add scripts**

Modify `package.json` scripts to include:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest",
  "db:generate": "prisma generate",
  "db:migrate": "prisma migrate dev",
  "db:seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 4: Create `.env.example`**

Use:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lia?schema=public"
SESSION_SECRET="replace-with-32-plus-random-characters"
SEED_ADMIN_NAME="Administrador"
SEED_ADMIN_EMAIL="admin@lia.local"
SEED_ADMIN_PASSWORD="change-this-password"
SEED_API_KEY_NAME="lia-agent-local"
CLINIC_NAME="Dr. Darcy Mavignier"
CLINIC_SUBTITLE="odontologia integrada"
CLINIC_SPECIALTY="Cirurgião-Dentista"
CLINIC_CRO="CRO-CE 4157"
CLINIC_PHONE="(00) 00000-0000"
CLINIC_ADDRESS="Rua das Flores, 123 - Centro"
CLINIC_CITY_LINE="Cidade - UF - CEP 00000-000"
CLINIC_WEBSITE="www.darcymavignier.com.br"
```

- [ ] **Step 5: Create Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
  },
});
```

Create `tests/setup.ts`:

```ts
process.env.SESSION_SECRET ??= "test-session-secret-with-more-than-32-chars";
```

Create `tests/smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("test runner", () => {
  it("runs the project test suite", () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 6: Verify**

Run:

```powershell
pnpm test
pnpm lint
```

Expected: the smoke test passes; lint passes or only reports existing scaffold issues to fix in the same task.

- [ ] **Step 7: Commit**

```powershell
git add package.json pnpm-lock.yaml .env.example vitest.config.ts tests/setup.ts tests/smoke.test.ts
git commit -m "chore: configure lia web dependencies"
```

---

### Task 2: Prisma Schema, Migration, and Seed

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `lib/db/prisma.ts`
- Create: `lib/auth/passwords.ts`
- Create: `lib/auth/tokens.ts`
- Test: `tests/auth.test.ts`

- [ ] **Step 1: Write password and token tests**

Create `tests/auth.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../lib/auth/passwords";
import { hashToken, createOpaqueToken } from "../lib/auth/tokens";

describe("auth primitives", () => {
  it("verifies bcrypt password hashes", async () => {
    const hash = await hashPassword("correct-password");
    await expect(verifyPassword("correct-password", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("creates opaque tokens and hashes them deterministically", () => {
    const token = createOpaqueToken();
    expect(token.length).toBeGreaterThanOrEqual(32);
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe(hashToken("def"));
  });
});
```

- [ ] **Step 2: Run failing test**

Run:

```powershell
pnpm test tests/auth.test.ts
```

Expected: fails because auth helpers do not exist.

- [ ] **Step 3: Create auth helpers**

Create `lib/auth/passwords.ts`:

```ts
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
```

Create `lib/auth/tokens.ts`:

```ts
import { createHash, randomBytes } from "node:crypto";

export function createOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
```

- [ ] **Step 4: Create Prisma schema**

Create `prisma/schema.prisma` with models:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  admin
  dentist
  assistant
}

enum AppointmentStatus {
  scheduled
  confirmed
  cancelled
  completed
}

model User {
  id           String    @id @default(cuid())
  name         String
  email        String    @unique
  passwordHash String
  role         UserRole
  isActive     Boolean   @default(true)
  sessions     Session[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model Session {
  id        String   @id @default(cuid())
  tokenHash String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model ApiKey {
  id         String    @id @default(cuid())
  name       String
  keyHash    String    @unique
  isActive   Boolean   @default(true)
  lastUsedAt DateTime?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}

model ClinicProfile {
  id        String   @id @default("default")
  name      String
  subtitle  String
  specialty String
  cro       String
  phone     String
  address   String
  cityLine  String
  website   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Patient {
  id           String               @id @default(cuid())
  name         String
  phone        String
  email        String?
  cpf          String?
  birthDate    DateTime?
  recordNumber String?
  notes        String?
  appointments Appointment[]
  quotes       Quote[]
  prescriptions Prescription[]
  certificates MedicalCertificate[]
  createdAt    DateTime             @default(now())
  updatedAt    DateTime             @updatedAt
}

model CatalogItem {
  id              String        @id @default(cuid())
  name            String
  description     String?
  priceCents      Int
  durationMinutes Int
  isActive        Boolean       @default(true)
  appointments    Appointment[]
  quoteLines      QuoteLine[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

model Appointment {
  id              String            @id @default(cuid())
  patientId       String
  catalogItemId   String?
  title           String
  startsAt        DateTime
  durationMinutes Int
  status          AppointmentStatus @default(scheduled)
  notes           String?
  patient         Patient           @relation(fields: [patientId], references: [id], onDelete: Cascade)
  catalogItem     CatalogItem?      @relation(fields: [catalogItemId], references: [id], onDelete: SetNull)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}

model Quote {
  id             String      @id @default(cuid())
  patientId      String
  number         String      @unique
  issueDate      DateTime
  paymentMethod  String?
  validityDays   Int?
  discountCents  Int         @default(0)
  notes          String?
  patient        Patient     @relation(fields: [patientId], references: [id], onDelete: Cascade)
  lines          QuoteLine[]
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
}

model QuoteLine {
  id            String       @id @default(cuid())
  quoteId       String
  catalogItemId String?
  description   String
  quantity      Int
  unitPriceCents Int
  totalPriceCents Int
  quote         Quote        @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  catalogItem   CatalogItem? @relation(fields: [catalogItemId], references: [id], onDelete: SetNull)
}

model Prescription {
  id        String             @id @default(cuid())
  patientId String
  issueDate DateTime
  notes     String?
  patient   Patient            @relation(fields: [patientId], references: [id], onDelete: Cascade)
  items     PrescriptionItem[]
  createdAt DateTime           @default(now())
  updatedAt DateTime           @updatedAt
}

model PrescriptionItem {
  id             String       @id @default(cuid())
  prescriptionId String
  medicine       String
  instructions   String
  position       Int
  prescription   Prescription @relation(fields: [prescriptionId], references: [id], onDelete: Cascade)
}

model MedicalCertificate {
  id               String   @id @default(cuid())
  patientId        String
  issueDate        DateTime
  absenceStartDate DateTime
  absenceEndDate   DateTime
  cid              String
  city             String
  notes            String?
  patient          Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

- [ ] **Step 5: Create Prisma singleton**

Create `lib/db/prisma.ts`:

```ts
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 6: Create seed script**

Create `prisma/seed.ts`:

```ts
import { PrismaClient } from "../app/generated/prisma/client";
import { hashPassword } from "../lib/auth/passwords";
import { createOpaqueToken, hashToken } from "../lib/auth/tokens";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@lia.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "change-this-password";
  const apiKey = createOpaqueToken();

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: process.env.SEED_ADMIN_NAME ?? "Administrador",
      role: "admin",
      isActive: true,
    },
    create: {
      name: process.env.SEED_ADMIN_NAME ?? "Administrador",
      email: adminEmail,
      passwordHash: await hashPassword(adminPassword),
      role: "admin",
      isActive: true,
    },
  });

  await prisma.clinicProfile.upsert({
    where: { id: "default" },
    update: {
      name: process.env.CLINIC_NAME ?? "Dr. Darcy Mavignier",
      subtitle: process.env.CLINIC_SUBTITLE ?? "odontologia integrada",
      specialty: process.env.CLINIC_SPECIALTY ?? "Cirurgião-Dentista",
      cro: process.env.CLINIC_CRO ?? "CRO-CE 4157",
      phone: process.env.CLINIC_PHONE ?? "(00) 00000-0000",
      address: process.env.CLINIC_ADDRESS ?? "Rua das Flores, 123 - Centro",
      cityLine: process.env.CLINIC_CITY_LINE ?? "Cidade - UF - CEP 00000-000",
      website: process.env.CLINIC_WEBSITE ?? "www.darcymavignier.com.br",
    },
    create: {
      id: "default",
      name: process.env.CLINIC_NAME ?? "Dr. Darcy Mavignier",
      subtitle: process.env.CLINIC_SUBTITLE ?? "odontologia integrada",
      specialty: process.env.CLINIC_SPECIALTY ?? "Cirurgião-Dentista",
      cro: process.env.CLINIC_CRO ?? "CRO-CE 4157",
      phone: process.env.CLINIC_PHONE ?? "(00) 00000-0000",
      address: process.env.CLINIC_ADDRESS ?? "Rua das Flores, 123 - Centro",
      cityLine: process.env.CLINIC_CITY_LINE ?? "Cidade - UF - CEP 00000-000",
      website: process.env.CLINIC_WEBSITE ?? "www.darcymavignier.com.br",
    },
  });

  const existingApiKey = await prisma.apiKey.findFirst({
    where: { name: process.env.SEED_API_KEY_NAME ?? "lia-agent-local" },
  });

  if (!existingApiKey) {
    await prisma.apiKey.create({
      data: {
        name: process.env.SEED_API_KEY_NAME ?? "lia-agent-local",
        keyHash: hashToken(apiKey),
        isActive: true,
      },
    });
    console.log(`Seed API key: ${apiKey}`);
  }

  console.log(`Seed admin email: ${adminEmail}`);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
```

- [ ] **Step 7: Migrate and seed**

Run:

```powershell
pnpm db:generate
pnpm db:migrate --name init
pnpm db:seed
pnpm test tests/auth.test.ts
```

Expected: Prisma client generated, migration applied to database `lia`, seed prints admin email and first API key, auth tests pass.

- [ ] **Step 8: Commit**

```powershell
git add prisma app/generated lib/db lib/auth tests/auth.test.ts
git commit -m "feat: add database schema and auth primitives"
```

---

### Task 3: Permissions, Auth Sessions, and Route Guards

**Files:**
- Create: `lib/permissions.ts`
- Create: `lib/auth/session.ts`
- Create: `lib/auth/guards.ts`
- Create: `app/(auth)/login/actions.ts`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/login/login-form.tsx`
- Test: `tests/permissions.test.ts`

- [ ] **Step 1: Write permission tests**

Create `tests/permissions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { canAccessResource, type Role, type Resource } from "../lib/permissions";

const roles: Role[] = ["admin", "dentist", "assistant"];
const clinical: Resource[] = ["patients", "appointments", "quotes", "prescriptions", "certificates"];

describe("role permissions", () => {
  it("lets all roles CRUD clinical resources", () => {
    for (const role of roles) {
      for (const resource of clinical) {
        expect(canAccessResource(role, resource, "create")).toBe(true);
        expect(canAccessResource(role, resource, "read")).toBe(true);
        expect(canAccessResource(role, resource, "update")).toBe(true);
        expect(canAccessResource(role, resource, "delete")).toBe(true);
      }
    }
  });

  it("restricts users and catalog writes to admin", () => {
    expect(canAccessResource("admin", "users", "create")).toBe(true);
    expect(canAccessResource("dentist", "users", "read")).toBe(false);
    expect(canAccessResource("assistant", "users", "delete")).toBe(false);
    expect(canAccessResource("admin", "catalog", "update")).toBe(true);
    expect(canAccessResource("dentist", "catalog", "read")).toBe(true);
    expect(canAccessResource("assistant", "catalog", "read")).toBe(true);
    expect(canAccessResource("dentist", "catalog", "update")).toBe(false);
    expect(canAccessResource("assistant", "catalog", "delete")).toBe(false);
  });
});
```

- [ ] **Step 2: Run failing test**

```powershell
pnpm test tests/permissions.test.ts
```

Expected: fails because `lib/permissions.ts` does not exist.

- [ ] **Step 3: Implement permissions**

Create `lib/permissions.ts`:

```ts
export type Role = "admin" | "dentist" | "assistant";
export type Action = "create" | "read" | "update" | "delete";
export type Resource =
  | "users"
  | "catalog"
  | "patients"
  | "appointments"
  | "quotes"
  | "prescriptions"
  | "certificates";

const clinicalResources: Resource[] = [
  "patients",
  "appointments",
  "quotes",
  "prescriptions",
  "certificates",
];

export function canAccessResource(role: Role, resource: Resource, action: Action) {
  if (role === "admin") return true;
  if (clinicalResources.includes(resource)) return true;
  if (resource === "catalog" && action === "read") return true;
  return false;
}
```

- [ ] **Step 4: Implement session helpers**

Create `lib/auth/session.ts` with functions:

```ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { createOpaqueToken, hashToken } from "@/lib/auth/tokens";

const COOKIE_NAME = "lia_session";
const SESSION_DAYS = 7;

export async function createSession(userId: string) {
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt <= new Date() || !session.user.isActive) {
    return null;
  }

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
```

Create `lib/auth/guards.ts` with role/resource guards using `requireUser()` and `canAccessResource()`.

- [ ] **Step 5: Implement login**

Create `app/(auth)/login/actions.ts` with a Server Action that validates email/password, checks `isActive`, verifies password, creates session, and redirects to `/agenda`.

Create `app/(auth)/login/page.tsx` and `app/(auth)/login/login-form.tsx` with a real form using `useActionState`.

- [ ] **Step 6: Verify**

Run:

```powershell
pnpm test tests/permissions.test.ts tests/auth.test.ts
pnpm lint
```

Expected: all tests pass and lint passes.

- [ ] **Step 7: Commit**

```powershell
git add lib/permissions.ts lib/auth app/(auth) tests/permissions.test.ts
git commit -m "feat: add authentication and role guards"
```

---

### Task 4: Dashboard Shell and Shared UI Components

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Create: `app/(dashboard)/layout.tsx`
- Create: `app/(dashboard)/page.tsx`
- Create: `components/app-shell.tsx`
- Create: `components/field.tsx`
- Create: `components/empty-state.tsx`
- Create: `components/submit-button.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Replace scaffold metadata and root redirect**

Set metadata to Lia/Dr. Darcy. Make `app/page.tsx` redirect authenticated users to `/agenda` and unauthenticated users to `/login`.

- [ ] **Step 2: Create dashboard shell**

`components/app-shell.tsx` renders navigation:

- Agenda.
- Pacientes.
- Orçamentos.
- Receitas.
- Atestados.
- Catálogo.
- Usuários.

Catálogo and Usuários render only when role permits access to those resources.

- [ ] **Step 3: Create protected dashboard layout**

`app/(dashboard)/layout.tsx` calls `requireUser()` and wraps children in `AppShell`.

- [ ] **Step 4: Add shared UI utilities**

Create reusable field, empty state, and submit button components. Keep them unopinionated and small.

- [ ] **Step 5: Verify**

Run:

```powershell
pnpm lint
pnpm build
```

Expected: build succeeds and scaffold Next.js landing page is gone.

- [ ] **Step 6: Commit**

```powershell
git add app components
git commit -m "feat: add protected dashboard shell"
```

---

### Task 5: Users Module

**Files:**
- Create: `lib/modules/users/schema.ts`
- Create: `lib/modules/users/service.ts`
- Create: `app/(dashboard)/usuarios/page.tsx`
- Create: `app/(dashboard)/usuarios/actions.ts`
- Create: `app/(dashboard)/usuarios/user-form.tsx`
- Test: `tests/modules/users.test.ts`

- [ ] **Step 1: Write service tests**

Test that:

- Creating a user hashes the password.
- Duplicate email is rejected.
- Updating role persists.
- Inactivating a user prevents subsequent login through session guard behavior.

- [ ] **Step 2: Implement schemas and service**

Service functions:

- `listUsers()`
- `createUser(input)`
- `updateUser(id, input)`
- `setUserActive(id, isActive)`
- `deleteUser(id)`

Schemas validate name, email, password, role, and active state.

- [ ] **Step 3: Implement admin page and actions**

Each action calls `requirePermission("users", action)`.

Page supports:

- list users,
- create user,
- edit user,
- change password,
- activate/inactivate,
- delete when allowed by database constraints.

- [ ] **Step 4: Verify**

Run:

```powershell
pnpm test tests/modules/users.test.ts
pnpm lint
```

- [ ] **Step 5: Commit**

```powershell
git add lib/modules/users app/(dashboard)/usuarios tests/modules/users.test.ts
git commit -m "feat: add user administration"
```

---

### Task 6: Patients Module

**Files:**
- Create: `lib/modules/patients/schema.ts`
- Create: `lib/modules/patients/service.ts`
- Create: `app/(dashboard)/pacientes/page.tsx`
- Create: `app/(dashboard)/pacientes/actions.ts`
- Create: `app/(dashboard)/pacientes/patient-form.tsx`
- Create: `app/(dashboard)/pacientes/[id]/page.tsx`
- Test: `tests/modules/patients.test.ts`

- [ ] **Step 1: Write tests**

Cover:

- patient requires name and phone,
- search matches name, phone, email, and CPF,
- detail loader includes appointments, quotes, prescriptions, and certificates.

- [ ] **Step 2: Implement service**

Functions:

- `listPatients({ query })`
- `getPatientDetail(id)`
- `createPatient(input)`
- `updatePatient(id, input)`
- `deletePatient(id)`

- [ ] **Step 3: Implement UI**

Page supports list, search, create, edit, delete, and detail. Detail page links to create quote, prescription, certificate, and appointment for the patient.

- [ ] **Step 4: Verify**

```powershell
pnpm test tests/modules/patients.test.ts
pnpm lint
```

- [ ] **Step 5: Commit**

```powershell
git add lib/modules/patients app/(dashboard)/pacientes tests/modules/patients.test.ts
git commit -m "feat: add patient management"
```

---

### Task 7: Catalog Module

**Files:**
- Create: `lib/modules/catalog/schema.ts`
- Create: `lib/modules/catalog/service.ts`
- Create: `app/(dashboard)/catalogo/page.tsx`
- Create: `app/(dashboard)/catalogo/actions.ts`
- Create: `app/(dashboard)/catalogo/catalog-form.tsx`
- Test: `tests/modules/catalog.test.ts`

- [ ] **Step 1: Write tests**

Cover:

- name, price, and duration are required,
- price is stored as cents,
- inactive items are excluded from selectable list,
- active/inactive transition works.

- [ ] **Step 2: Implement service**

Functions:

- `listCatalogItems({ includeInactive })`
- `listActiveCatalogItems()`
- `createCatalogItem(input)`
- `updateCatalogItem(id, input)`
- `setCatalogItemActive(id, isActive)`
- `deleteCatalogItem(id)`

- [ ] **Step 3: Implement admin UI**

Actions call catalog permissions. `dentist` and `assistant` must not reach mutation actions.

- [ ] **Step 4: Verify**

```powershell
pnpm test tests/modules/catalog.test.ts
pnpm lint
```

- [ ] **Step 5: Commit**

```powershell
git add lib/modules/catalog app/(dashboard)/catalogo tests/modules/catalog.test.ts
git commit -m "feat: add catalog management"
```

---

### Task 8: Appointments and Agenda Module

**Files:**
- Create: `lib/modules/appointments/schema.ts`
- Create: `lib/modules/appointments/service.ts`
- Create: `app/(dashboard)/agenda/page.tsx`
- Create: `app/(dashboard)/agenda/actions.ts`
- Create: `app/(dashboard)/agenda/appointment-form.tsx`
- Test: `tests/modules/appointments.test.ts`

- [ ] **Step 1: Write tests**

Cover:

- appointment requires patient, start time, and duration,
- status must be one of `scheduled`, `confirmed`, `cancelled`, `completed`,
- catalog item is optional,
- weekly query returns appointments ordered by start time.

- [ ] **Step 2: Implement service**

Functions:

- `listAppointments({ from, to })`
- `createAppointment(input)`
- `updateAppointment(id, input)`
- `deleteAppointment(id)`
- `setAppointmentStatus(id, status)`

- [ ] **Step 3: Implement agenda UI**

Use the visual direction from `lia-agenda.html`, corrected to Lia/Dr. Darcy. The page must show real appointments from DB and expose working create/edit/status/delete actions.

- [ ] **Step 4: Verify**

```powershell
pnpm test tests/modules/appointments.test.ts
pnpm lint
```

- [ ] **Step 5: Commit**

```powershell
git add lib/modules/appointments app/(dashboard)/agenda tests/modules/appointments.test.ts
git commit -m "feat: add appointment agenda"
```

---

### Task 9: Shared PDF Foundation and Clinic Profile

**Files:**
- Create: `lib/clinic/profile.ts`
- Create: `lib/pdf/theme.ts`
- Create: `lib/pdf/layout.tsx`
- Create: `lib/pdf/render.ts`
- Test: `tests/pdf/render.test.ts`

- [ ] **Step 1: Write PDF smoke test**

Create a test that renders a minimal PDF document and asserts the result is a non-empty buffer starting with `%PDF`.

- [ ] **Step 2: Implement clinic profile loader**

`getClinicProfile()` loads the single `ClinicProfile` row with id `default`.

- [ ] **Step 3: Implement PDF renderer**

`renderPdfToBuffer(document: React.ReactElement)` wraps `@react-pdf/renderer` and returns a `Buffer`.

- [ ] **Step 4: Implement shared visual system**

Use:

- red `#D32F2F`,
- grayscale text,
- document size A4,
- structured header,
- patient info box,
- signature box,
- footer.

- [ ] **Step 5: Verify**

```powershell
pnpm test tests/pdf/render.test.ts
pnpm lint
```

- [ ] **Step 6: Commit**

```powershell
git add lib/clinic lib/pdf tests/pdf/render.test.ts
git commit -m "feat: add pdf rendering foundation"
```

---

### Task 10: Quotes Module and PDF

**Files:**
- Create: `lib/modules/quotes/schema.ts`
- Create: `lib/modules/quotes/service.ts`
- Create: `lib/pdf/quote-document.tsx`
- Create: `app/(dashboard)/orcamentos/page.tsx`
- Create: `app/(dashboard)/orcamentos/actions.ts`
- Create: `app/(dashboard)/orcamentos/quote-form.tsx`
- Create: `app/(dashboard)/orcamentos/[id]/page.tsx`
- Create: `app/api/pdf/orcamentos/[id]/route.ts`
- Test: `tests/modules/quotes.test.ts`
- Test: `tests/pdf/quote.test.ts`

- [ ] **Step 1: Write tests**

Cover:

- quote requires patient and at least one line,
- line total equals quantity times unit price,
- quote total equals subtotal minus discount,
- quote number is unique,
- PDF renders as a non-empty PDF buffer.

- [ ] **Step 2: Implement service**

Functions:

- `listQuotes()`
- `getQuote(id)`
- `createQuote(input)`
- `updateQuote(id, input)`
- `deleteQuote(id)`
- `buildQuotePdfData(id)`

- [ ] **Step 3: Implement UI**

Screens support list, create, edit, detail, delete, and PDF download. Form supports catalog lines and manual lines.

- [ ] **Step 4: Implement PDF route**

`GET /api/pdf/orcamentos/[id]` checks web session permission, renders the persisted quote, and returns:

```ts
return new Response(buffer, {
  headers: {
    "content-type": "application/pdf",
    "content-disposition": `attachment; filename="orcamento-${quote.number}.pdf"`,
  },
});
```

- [ ] **Step 5: Verify**

```powershell
pnpm test tests/modules/quotes.test.ts tests/pdf/quote.test.ts
pnpm lint
```

- [ ] **Step 6: Commit**

```powershell
git add lib/modules/quotes lib/pdf/quote-document.tsx app/(dashboard)/orcamentos app/api/pdf/orcamentos tests/modules/quotes.test.ts tests/pdf/quote.test.ts
git commit -m "feat: add quote management and pdf"
```

---

### Task 11: Prescriptions Module and PDF

**Files:**
- Create: `lib/modules/prescriptions/schema.ts`
- Create: `lib/modules/prescriptions/service.ts`
- Create: `lib/pdf/prescription-document.tsx`
- Create: `app/(dashboard)/receitas/page.tsx`
- Create: `app/(dashboard)/receitas/actions.ts`
- Create: `app/(dashboard)/receitas/prescription-form.tsx`
- Create: `app/(dashboard)/receitas/[id]/page.tsx`
- Create: `app/api/pdf/receitas/[id]/route.ts`
- Test: `tests/modules/prescriptions.test.ts`
- Test: `tests/pdf/prescription.test.ts`

- [ ] **Step 1: Write tests**

Cover:

- prescription requires patient and at least one item,
- item order is preserved through `position`,
- PDF renders as a non-empty PDF buffer.

- [ ] **Step 2: Implement service**

Functions:

- `listPrescriptions()`
- `getPrescription(id)`
- `createPrescription(input)`
- `updatePrescription(id, input)`
- `deletePrescription(id)`
- `buildPrescriptionPdfData(id)`

- [ ] **Step 3: Implement UI**

Screens support list, create, edit, detail, delete, and PDF download.

- [ ] **Step 4: Implement PDF route**

`GET /api/pdf/receitas/[id]` checks web session permission and returns a persisted prescription PDF.

- [ ] **Step 5: Verify**

```powershell
pnpm test tests/modules/prescriptions.test.ts tests/pdf/prescription.test.ts
pnpm lint
```

- [ ] **Step 6: Commit**

```powershell
git add lib/modules/prescriptions lib/pdf/prescription-document.tsx app/(dashboard)/receitas app/api/pdf/receitas tests/modules/prescriptions.test.ts tests/pdf/prescription.test.ts
git commit -m "feat: add prescription management and pdf"
```

---

### Task 12: Medical Certificates Module and PDF

**Files:**
- Create: `lib/modules/certificates/schema.ts`
- Create: `lib/modules/certificates/service.ts`
- Create: `lib/pdf/certificate-document.tsx`
- Create: `app/(dashboard)/atestados/page.tsx`
- Create: `app/(dashboard)/atestados/actions.ts`
- Create: `app/(dashboard)/atestados/certificate-form.tsx`
- Create: `app/(dashboard)/atestados/[id]/page.tsx`
- Create: `app/api/pdf/atestados/[id]/route.ts`
- Test: `tests/modules/certificates.test.ts`
- Test: `tests/pdf/certificate.test.ts`

- [ ] **Step 1: Write tests**

Cover:

- certificate requires patient, issue date, absence dates, city, and CID,
- end date cannot be before start date,
- generated text includes patient name, period, CID, city, and CRO,
- PDF renders as a non-empty PDF buffer.

- [ ] **Step 2: Implement service**

Functions:

- `listCertificates()`
- `getCertificate(id)`
- `createCertificate(input)`
- `updateCertificate(id, input)`
- `deleteCertificate(id)`
- `buildCertificatePdfData(id)`

- [ ] **Step 3: Implement UI**

Screens support list, create, edit, detail, delete, and PDF download.

- [ ] **Step 4: Implement PDF route**

`GET /api/pdf/atestados/[id]` checks web session permission and returns a persisted certificate PDF.

- [ ] **Step 5: Verify**

```powershell
pnpm test tests/modules/certificates.test.ts tests/pdf/certificate.test.ts
pnpm lint
```

- [ ] **Step 6: Commit**

```powershell
git add lib/modules/certificates lib/pdf/certificate-document.tsx app/(dashboard)/atestados app/api/pdf/atestados tests/modules/certificates.test.ts tests/pdf/certificate.test.ts
git commit -m "feat: add certificate management and pdf"
```

---

### Task 13: Private Agent API

**Files:**
- Create: `lib/auth/api-keys.ts`
- Create: `lib/http.ts`
- Create: `app/api/agent/v1/patients/route.ts`
- Create: `app/api/agent/v1/patients/[id]/route.ts`
- Create: `app/api/agent/v1/catalog/route.ts`
- Create: `app/api/agent/v1/appointments/route.ts`
- Create: `app/api/agent/v1/appointments/[id]/route.ts`
- Create: `app/api/agent/v1/quotes/route.ts`
- Create: `app/api/agent/v1/quotes/[id]/route.ts`
- Create: `app/api/agent/v1/quotes/[id]/pdf/route.ts`
- Create: `app/api/agent/v1/prescriptions/route.ts`
- Create: `app/api/agent/v1/prescriptions/[id]/route.ts`
- Create: `app/api/agent/v1/prescriptions/[id]/pdf/route.ts`
- Create: `app/api/agent/v1/certificates/route.ts`
- Create: `app/api/agent/v1/certificates/[id]/route.ts`
- Create: `app/api/agent/v1/certificates/[id]/pdf/route.ts`
- Test: `tests/api/api-key.test.ts`

- [ ] **Step 1: Write API key tests**

Cover:

- missing key returns unauthorized result,
- invalid key returns unauthorized result,
- valid active key passes,
- inactive key fails,
- successful validation updates `lastUsedAt`.

- [ ] **Step 2: Implement API key guard**

`requireApiKey(request: Request)` reads `x-api-key`, hashes it, finds active key, updates `lastUsedAt`, and returns the API key record or throws an HTTP error.

- [ ] **Step 3: Implement JSON helpers**

`lib/http.ts` exports:

- `jsonOk(data, init?)`
- `jsonError(status, message, details?)`
- `withApiErrors(handler)`

- [ ] **Step 4: Implement route handlers**

Use Next.js route handlers. Each route:

- calls `requireApiKey(request)`,
- parses JSON body when needed,
- calls the same module services used by web actions,
- returns JSON with stable ids and data,
- returns PDF buffers for `/pdf` routes.

- [ ] **Step 5: Verify**

```powershell
pnpm test tests/api/api-key.test.ts
pnpm lint
pnpm build
```

- [ ] **Step 6: Commit**

```powershell
git add lib/auth/api-keys.ts lib/http.ts app/api/agent tests/api/api-key.test.ts
git commit -m "feat: add private agent api"
```

---

### Task 14: End-to-End Data Integrity and UI Hardening

**Files:**
- Modify: all module pages/actions as needed
- Modify: `app/globals.css`
- Create: `tests/modules/integration.test.ts`

- [ ] **Step 1: Add integration test**

Cover a full business path:

1. Create patient.
2. Create catalog item.
3. Create appointment for patient.
4. Create quote with catalog line.
5. Create prescription.
6. Create certificate.
7. Load patient detail and assert all related records are present.

- [ ] **Step 2: Remove non-functional controls**

Audit every visible button/link. Delete or wire any visible control that has no working action.

- [ ] **Step 3: Verify permissions manually**

Use seeded users or created users:

- `admin` can access users and catalog.
- `dentist` cannot access users or mutate catalog.
- `assistant` cannot access users or mutate catalog.
- all roles can use patients, agenda, quotes, prescriptions, and certificates.

- [ ] **Step 4: Verify PDF downloads manually**

Create one quote, one prescription, and one certificate from the web UI. Download each PDF and inspect:

- correct patient data,
- Dr. Darcy identity,
- CRO-CE 4157,
- expected title,
- expected document-specific fields.

- [ ] **Step 5: Run full verification**

```powershell
pnpm test
pnpm lint
pnpm build
```

Expected: all pass.

- [ ] **Step 6: Commit**

```powershell
git add .
git commit -m "test: verify lia platform workflows"
```

---

## Final Acceptance Checklist

- [ ] Database `lia` has all migrations applied.
- [ ] Seed creates initial admin and API key.
- [ ] Login and logout work.
- [ ] `admin` can manage users and catalog.
- [ ] `dentist` and `assistant` cannot manage users or mutate catalog.
- [ ] Patients CRUD works.
- [ ] Agenda CRUD works with real patients and catalog items.
- [ ] Quotes CRUD works and generates PDF.
- [ ] Prescriptions CRUD works and generates PDF.
- [ ] Certificates CRUD works and generates PDF.
- [ ] API rejects missing/invalid `x-api-key`.
- [ ] API can operate patients, appointments, quotes, prescriptions, and certificates with a valid API key.
- [ ] `pnpm test` passes.
- [ ] `pnpm lint` passes.
- [ ] `pnpm build` passes.

## Implementation Order

Execute tasks in order. Do not start PDF routes before the PDF foundation exists. Do not build API routes before web/domain services exist. Commit after every task that passes its verification.
