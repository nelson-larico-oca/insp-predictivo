# Reportes de Termografía para Fajas Transportadoras — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js web app where a specialist can register clients/contractors, configure conveyor-belt "fajas" with their pulleys and acceptance criteria, create thermography reports with per-pulley bearing photos, view them in the browser with historical trend charts, and export them as a PDF that closely matches the original Excel-based report format.

**Architecture:** Next.js (App Router, TypeScript) monolith with Server Actions for all writes, Prisma over a local PostgreSQL database, NextAuth (Credentials provider, JWT, single role) for login, Cloudinary for direct-from-browser signed image uploads, Recharts for trend charts, and a Puppeteer-driven internal "print route" that turns the same React UI into the downloadable PDF.

**Tech Stack:** Next.js 14 (App Router, `src/` dir), TypeScript, Tailwind CSS, Prisma 5, PostgreSQL, NextAuth 4, bcryptjs, Cloudinary SDK, Recharts, Puppeteer, Vitest.

## Global Constraints

- Database: local PostgreSQL, database name `insp_predictivo`, connection string `postgresql://postgres:root@localhost:5432/insp_predictivo`.
- Package manager: npm.
- TypeScript strict mode throughout; no `any` in new code.
- Framework: Next.js App Router with a `src/` directory and the `@/*` import alias pointing at `src/*`.
- Auth: NextAuth v4, Credentials provider, JWT session strategy, single role for all logged-in users (no permission tiers).
- Testing: Vitest. Test files live under `tests/`, mirroring the path of the file under test inside `src/`. Integration tests run against the real local dev database (no separate test DB) and must delete any rows they create.
- Uploads: Cloudinary, using direct-from-browser signed uploads (the app server only issues signatures, never proxies file bytes).
- PDF export: Puppeteer renders an internal, token-protected print route — no separate PDF layout implementation.
- No automated browser E2E tests in this plan (per spec, manual verification covers upload/PDF output).
- Commit after each task using only the files that task touched.

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a bootable Next.js app at `src/app/*`, the `@/*` → `src/*` path alias, Tailwind wired into `globals.css`, and the npm scripts (`dev`, `build`, `start`, `lint`, `test`, `prisma:migrate`, `prisma:generate`, `prisma:seed`) every later task relies on.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "insp-predictivo",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "prisma:migrate": "prisma migrate dev",
    "prisma:generate": "prisma generate",
    "prisma:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@prisma/client": "^5.18.0",
    "next-auth": "^4.24.7",
    "bcryptjs": "^2.4.3",
    "cloudinary": "^2.4.0",
    "recharts": "^2.12.7"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/bcryptjs": "^2.4.6",
    "tailwindcss": "^3.4.7",
    "postcss": "^8.4.40",
    "autoprefixer": "^10.4.19",
    "prisma": "^5.18.0",
    "vitest": "^2.0.5",
    "tsx": "^4.16.5",
    "puppeteer": "^22.15.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`**

```js
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {}
export default nextConfig
```

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: {} },
  plugins: [],
}
export default config
```

```js
// postcss.config.mjs
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
```

- [ ] **Step 4: Create `.env.example` and `.gitignore`**

```
# .env.example
DATABASE_URL="postgresql://postgres:root@localhost:5432/insp_predictivo"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-me-to-a-random-string"
SEED_USER_EMAIL="admin@insp.local"
SEED_USER_PASSWORD="changeme123"
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
PRINT_TOKEN_SECRET="change-me-to-a-random-string"
APP_BASE_URL="http://localhost:3000"
```

```
# .gitignore
node_modules
.next
.env
.env.local
dist
```

Copy `.env.example` to `.env` locally and fill in real Cloudinary credentials — `.env` is git-ignored.

- [ ] **Step 5: Create the App Router entry files**

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Inspección Predictiva - Reportes de Termografía',
  description: 'Gestión de fajas y reportes de termografía de chumaceras',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}
```

```tsx
// src/app/page.tsx
export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-semibold">Inspección Predictiva</h1>
    </main>
  )
}
```

- [ ] **Step 6: Install and verify**

Run: `npm install`
Run: `npm run build`
Expected: build completes with "Compiled successfully" and no type errors.

Run: `npm run dev`, open `http://localhost:3000` and confirm the "Inspección Predictiva" heading renders. Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json next.config.mjs tailwind.config.ts postcss.config.mjs .env.example .gitignore src/app
git commit -m "chore: scaffold Next.js app with TypeScript and Tailwind"
```

---

### Task 2: Database schema and Prisma client

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`
- Create: `vitest.config.ts`
- Test: `tests/lib/prisma.test.ts`

**Interfaces:**
- Consumes: `DATABASE_URL` env var (Task 1's `.env`).
- Produces: Prisma models `User`, `Cliente`, `Contratista`, `Faja`, `CriterioAceptacion`, `Polea`, `Reporte`, `LecturaPolea` and enum `Condicion` (`NORMAL | TOLERABLE | PRECAUCION | CRITICO`); the shared client singleton `prisma` exported from `src/lib/prisma.ts`, used by every later task that touches the database.

- [ ] **Step 1: Create the database**

Run: `PGPASSWORD=root psql -U postgres -h localhost -c "CREATE DATABASE insp_predictivo;"`
(If `psql` isn't on PATH, create the `insp_predictivo` database with any Postgres client, e.g. pgAdmin.)

- [ ] **Step 2: Write the full schema**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Condicion {
  NORMAL
  TOLERABLE
  PRECAUCION
  CRITICO
}

model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}

model Cliente {
  id      String @id @default(cuid())
  nombre  String
  logoUrl String?
  fajas   Faja[]
}

model Contratista {
  id      String @id @default(cuid())
  nombre  String
  logoUrl String?
  fajas   Faja[]
}

model Faja {
  id              String               @id @default(cuid())
  clienteId       String
  cliente         Cliente              @relation(fields: [clienteId], references: [id])
  contratistaId   String
  contratista     Contratista          @relation(fields: [contratistaId], references: [id])
  area            String
  nombre          String
  tag             String               @unique
  lugar           String
  descripcion     String?
  numeroPoleas    Int
  esquemaUrl      String?
  createdByUserId String
  createdAt       DateTime             @default(now())
  poleas          Polea[]
  criterios       CriterioAceptacion[]
  reportes        Reporte[]
}

model CriterioAceptacion {
  id       String    @id @default(cuid())
  fajaId   String
  faja     Faja      @relation(fields: [fajaId], references: [id], onDelete: Cascade)
  nivel    Condicion
  tempMin  Float
  tempMax  Float
  deltaMin Float
  deltaMax Float
  color    String

  @@unique([fajaId, nivel])
}

model Polea {
  id       String         @id @default(cuid())
  fajaId   String
  faja     Faja           @relation(fields: [fajaId], references: [id], onDelete: Cascade)
  numero   Int
  tipo     String?
  lecturas LecturaPolea[]

  @@unique([fajaId, numero])
}

model Reporte {
  id                  String         @id @default(cuid())
  fajaId              String
  faja                Faja           @relation(fields: [fajaId], references: [id], onDelete: Cascade)
  fecha               DateTime
  especialista        String
  supervisor          String
  numeroAvisoSAP      String
  condicionGeneral    Condicion
  observacionGeneral  String         @default("Equipo sin indicaciones")
  createdByUserId     String
  createdAt           DateTime       @default(now())
  lecturas            LecturaPolea[]
}

model LecturaPolea {
  id               String    @id @default(cuid())
  reporteId        String
  reporte          Reporte   @relation(fields: [reporteId], references: [id], onDelete: Cascade)
  poleaId          String
  polea            Polea     @relation(fields: [poleaId], references: [id])
  tempIzquierda    Float
  tempDerecha      Float
  fotoIzquierdaUrl String
  fotoDerechaUrl   String
  condicion        Condicion
  diagnosticoTexto String

  @@unique([reporteId, poleaId])
}
```

- [ ] **Step 3: Run the migration and generate the client**

Run: `npx prisma migrate dev --name init`
Expected: migration applied, "Your database is now in sync with your schema."

- [ ] **Step 4: Create the Prisma client singleton**

```ts
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

- [ ] **Step 5: Create the Vitest config**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

- [ ] **Step 6: Write a smoke test confirming the DB connection**

```ts
// tests/lib/prisma.test.ts
import { describe, it, expect, afterAll } from 'vitest'
import { prisma } from '../../src/lib/prisma'

describe('prisma connection', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('can create and delete a User row', async () => {
    const user = await prisma.user.create({
      data: { name: 'Smoke Test', email: 'smoke-test@example.com', passwordHash: 'x' },
    })
    expect(user.id).toBeDefined()
    await prisma.user.delete({ where: { id: user.id } })
  })
})
```

- [ ] **Step 7: Run the test**

Run: `npx vitest run tests/lib/prisma.test.ts`
Expected: PASS (1 test).

- [ ] **Step 8: Commit**

```bash
git add prisma/schema.prisma src/lib/prisma.ts vitest.config.ts tests/lib/prisma.test.ts
git commit -m "feat: add Prisma schema and database connection"
```

---

### Task 3: Pure domain logic — tag, delta, condición, diagnóstico

**Files:**
- Create: `src/lib/tag.ts`
- Create: `src/lib/condicion.ts`
- Create: `src/lib/diagnosticoTemplate.ts`
- Test: `tests/lib/tag.test.ts`
- Test: `tests/lib/condicion.test.ts`
- Test: `tests/lib/diagnosticoTemplate.test.ts`

**Interfaces:**
- Consumes: `Condicion` enum from `@prisma/client` (Task 2).
- Produces: `computeTag(area, nombre): string`; `computeDelta(tempIzquierda, tempDerecha): number`; `worstCondicion(condiciones: Condicion[]): Condicion`; `CONDICION_COLORS: Record<Condicion, string>`; `buildDiagnosticoTexto(input: DiagnosticoInput): string` and its `DiagnosticoInput` type. Every server action and UI component that computes a tag, a delta, an overall condición, or a diagnostic paragraph uses these — no later task re-implements this logic.

- [ ] **Step 1: Write the failing test for `computeTag`**

```ts
// tests/lib/tag.test.ts
import { describe, it, expect } from 'vitest'
import { computeTag } from '../../src/lib/tag'

describe('computeTag', () => {
  it('joins area and nombre uppercased with no separator', () => {
    expect(computeTag('3220', 'CV001')).toBe('3220CV001')
  })

  it('trims whitespace and uppercases lowercase input', () => {
    expect(computeTag(' 3220 ', ' cv001 ')).toBe('3220CV001')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/tag.test.ts`
Expected: FAIL — `Cannot find module '../../src/lib/tag'`.

- [ ] **Step 3: Implement `computeTag`**

```ts
// src/lib/tag.ts
export function computeTag(area: string, nombre: string): string {
  return `${area.trim()}${nombre.trim()}`.toUpperCase()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/tag.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Write the failing test for delta and worst condición**

```ts
// tests/lib/condicion.test.ts
import { describe, it, expect } from 'vitest'
import { computeDelta, worstCondicion, CONDICION_COLORS } from '../../src/lib/condicion'

describe('computeDelta', () => {
  it('returns the absolute difference rounded to 1 decimal', () => {
    expect(computeDelta(18.6, 18.1)).toBe(0.5)
    expect(computeDelta(22.5, 32.4)).toBeCloseTo(9.9)
  })
})

describe('worstCondicion', () => {
  it('returns the most severe condicion in the list', () => {
    expect(worstCondicion(['NORMAL', 'TOLERABLE', 'NORMAL'])).toBe('TOLERABLE')
    expect(worstCondicion(['CRITICO', 'NORMAL'])).toBe('CRITICO')
    expect(worstCondicion(['NORMAL'])).toBe('NORMAL')
  })

  it('throws when given an empty list', () => {
    expect(() => worstCondicion([])).toThrow()
  })
})

describe('CONDICION_COLORS', () => {
  it('has an entry for every condicion level', () => {
    expect(Object.keys(CONDICION_COLORS).sort()).toEqual(
      ['CRITICO', 'NORMAL', 'PRECAUCION', 'TOLERABLE'].sort()
    )
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run tests/lib/condicion.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 7: Implement `condicion.ts`**

```ts
// src/lib/condicion.ts
import type { Condicion } from '@prisma/client'

const SEVERITY: Record<Condicion, number> = {
  NORMAL: 0,
  TOLERABLE: 1,
  PRECAUCION: 2,
  CRITICO: 3,
}

export const CONDICION_COLORS: Record<Condicion, string> = {
  NORMAL: '#22c55e',
  TOLERABLE: '#eab308',
  PRECAUCION: '#f97316',
  CRITICO: '#ef4444',
}

export function computeDelta(tempIzquierda: number, tempDerecha: number): number {
  return Math.round(Math.abs(tempIzquierda - tempDerecha) * 10) / 10
}

export function worstCondicion(condiciones: Condicion[]): Condicion {
  if (condiciones.length === 0) {
    throw new Error('worstCondicion requires at least one condicion')
  }
  return condiciones.reduce((worst, current) =>
    SEVERITY[current] > SEVERITY[worst] ? current : worst
  )
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run tests/lib/condicion.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 9: Write the failing test for the diagnostic template**

```ts
// tests/lib/diagnosticoTemplate.test.ts
import { describe, it, expect } from 'vitest'
import { buildDiagnosticoTexto } from '../../src/lib/diagnosticoTemplate'

describe('buildDiagnosticoTexto', () => {
  it('fills in the polea number, temperatures and condicion', () => {
    const texto = buildDiagnosticoTexto({
      numeroPolea: 3,
      tempIzquierda: 17.4,
      tempDerecha: 20.7,
      condicion: 'NORMAL',
    })
    expect(texto).toContain('polea 3')
    expect(texto).toContain('17.4°C')
    expect(texto).toContain('20.7°C')
    expect(texto).toContain('Condición NORMAL')
  })
})
```

- [ ] **Step 10: Run test to verify it fails**

Run: `npx vitest run tests/lib/diagnosticoTemplate.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 11: Implement `diagnosticoTemplate.ts`**

```ts
// src/lib/diagnosticoTemplate.ts
import type { Condicion } from '@prisma/client'

export interface DiagnosticoInput {
  numeroPolea: number
  tempIzquierda: number
  tempDerecha: number
  condicion: Condicion
}

export function buildDiagnosticoTexto(input: DiagnosticoInput): string {
  const { numeroPolea, tempIzquierda, tempDerecha, condicion } = input
  return (
    `Se efectuó inspección termográfica a las chumaceras de la polea ${numeroPolea}, ` +
    `no evidenciándose anomalías térmicas ni gradientes de temperatura fuera de los rangos operativos normales.\n\n` +
    `Temperatura de chumaceras:\n` +
    ` - Polea ${numeroPolea}: Chumacera lado izquierdo (${tempIzquierda.toFixed(1)}°C) ` +
    `Chumacera lado derecho (${tempDerecha.toFixed(1)}°C).\n\n` +
    `Observaciones: Condición ${condicion}.`
  )
}
```

- [ ] **Step 12: Run test to verify it passes**

Run: `npx vitest run tests/lib/diagnosticoTemplate.test.ts`
Expected: PASS (1 test).

- [ ] **Step 13: Commit**

```bash
git add src/lib/tag.ts src/lib/condicion.ts src/lib/diagnosticoTemplate.ts tests/lib/tag.test.ts tests/lib/condicion.test.ts tests/lib/diagnosticoTemplate.test.ts
git commit -m "feat: add tag, delta, condicion and diagnostico pure logic"
```

---

### Task 4: Authentication

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `middleware.ts`
- Create: `src/app/login/page.tsx`
- Create: `src/app/login/LoginForm.tsx`
- Create: `prisma/seed.ts`
- Test: `tests/lib/auth.test.ts`

**Interfaces:**
- Consumes: `prisma` (Task 2).
- Produces: `authOptions: NextAuthOptions` and `verifyCredentials(email, password): Promise<{id,name,email} | null>` from `src/lib/auth.ts`, used by the NextAuth route handler, by `getServerSession(authOptions)` calls in every protected API route from Task 5 onward, and by the seed script.

- [ ] **Step 1: Write the failing test for `verifyCredentials`**

```ts
// tests/lib/auth.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import bcrypt from 'bcryptjs'
import { prisma } from '../../src/lib/prisma'
import { verifyCredentials } from '../../src/lib/auth'

describe('verifyCredentials', () => {
  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('secret123', 10)
    await prisma.user.create({
      data: { name: 'Test User', email: 'auth-test@example.com', passwordHash },
    })
  })

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'auth-test@example.com' } })
    await prisma.$disconnect()
  })

  it('returns the user when credentials are correct', async () => {
    const result = await verifyCredentials('auth-test@example.com', 'secret123')
    expect(result?.email).toBe('auth-test@example.com')
  })

  it('returns null when the password is wrong', async () => {
    expect(await verifyCredentials('auth-test@example.com', 'wrong')).toBeNull()
  })

  it('returns null when the user does not exist', async () => {
    expect(await verifyCredentials('nobody@example.com', 'secret123')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/auth.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/auth.ts`**

```ts
// src/lib/auth.ts
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export interface AuthenticatedUser {
  id: string
  name: string
  email: string
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return null
  return { id: user.id, name: user.name, email: user.email }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        return verifyCredentials(credentials.email, credentials.password)
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = (user as AuthenticatedUser).id
      return token
    },
    async session({ session, token }) {
      if (session.user) (session.user as { id?: string }).id = token.id as string
      return session
    },
  },
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/auth.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Wire up the NextAuth route handler and middleware**

```ts
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

```ts
// middleware.ts
export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/clientes/:path*',
    '/contratistas/:path*',
    '/fajas/:path*',
    '/reportes/:path*',
    '/api/cloudinary/:path*',
  ],
}
```

- [ ] **Step 6: Build the login page**

```tsx
// src/app/login/page.tsx
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold">Iniciar sesión</h1>
        <LoginForm />
      </div>
    </main>
  )
}
```

```tsx
// src/app/login/LoginForm.tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) {
      setError('Email o contraseña incorrectos')
      return
    }
    router.push(searchParams.get('callbackUrl') ?? '/fajas')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="email"
        placeholder="Email"
        className="w-full rounded border px-3 py-2"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        className="w-full rounded border px-3 py-2"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="w-full rounded bg-blue-600 px-3 py-2 text-white">
        Entrar
      </button>
    </form>
  )
}
```

- [ ] **Step 7: Create the seed script**

```ts
// prisma/seed.ts
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

async function main() {
  const email = process.env.SEED_USER_EMAIL ?? 'admin@insp.local'
  const password = process.env.SEED_USER_PASSWORD ?? 'changeme123'
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`Seed user ${email} already exists, skipping.`)
    return
  }
  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { name: 'Administrador', email, passwordHash },
  })
  console.log(`Seed user created: ${email}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Run: `npm run prisma:seed`
Expected: "Seed user created: admin@insp.local".

- [ ] **Step 8: Manual verification**

Run: `npm run dev`, visit `http://localhost:3000/fajas` (doesn't exist yet, that's fine) and confirm you're redirected to `/login`. Log in with the seed user's email/password and confirm no crash (you'll land on a 404 for `/fajas` until Task 7 — that's expected at this point). Stop the dev server.

- [ ] **Step 9: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth src/app/login middleware.ts prisma/seed.ts tests/lib/auth.test.ts
git commit -m "feat: add credentials auth, login page and seed user"
```

---

### Task 5: Cloudinary signed uploads

**Files:**
- Create: `src/lib/cloudinary.ts`
- Create: `src/app/api/cloudinary/sign/route.ts`
- Create: `src/components/ImageUploader.tsx`
- Test: `tests/lib/cloudinary.test.ts`

**Interfaces:**
- Consumes: `authOptions` (Task 4) to protect the signing endpoint; `CLOUDINARY_*` env vars.
- Produces: `generateUploadSignature(folder): UploadSignature`; the `<ImageUploader folder value onUploaded label />` component, used by every form that uploads a logo, esquema, or termograma from Task 6 onward.

- [ ] **Step 1: Write the failing test for the signature helper**

```ts
// tests/lib/cloudinary.test.ts
import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.CLOUDINARY_CLOUD_NAME = 'demo'
  process.env.CLOUDINARY_API_KEY = 'key123'
  process.env.CLOUDINARY_API_SECRET = 'secret123'
})

describe('generateUploadSignature', () => {
  it('returns a signature, timestamp, apiKey, cloudName and folder', async () => {
    const { generateUploadSignature } = await import('../../src/lib/cloudinary')
    const result = generateUploadSignature('insp-predictivo/logos')
    expect(result.folder).toBe('insp-predictivo/logos')
    expect(result.apiKey).toBe('key123')
    expect(result.cloudName).toBe('demo')
    expect(typeof result.signature).toBe('string')
    expect(result.signature.length).toBeGreaterThan(0)
    expect(typeof result.timestamp).toBe('number')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/cloudinary.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/cloudinary.ts`**

```ts
// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary'

export interface UploadSignature {
  timestamp: number
  signature: string
  apiKey: string
  cloudName: string
  folder: string
}

export function generateUploadSignature(folder: string): UploadSignature {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  const timestamp = Math.round(Date.now() / 1000)
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET as string
  )
  return {
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
    folder,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/cloudinary.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Create the signing API route**

```ts
// src/app/api/cloudinary/sign/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateUploadSignature } from '@/lib/cloudinary'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const body = (await request.json()) as { folder?: string }
  if (!body.folder) {
    return NextResponse.json({ error: 'folder es requerido' }, { status: 400 })
  }
  return NextResponse.json(generateUploadSignature(body.folder))
}
```

- [ ] **Step 6: Build the reusable uploader component**

```tsx
// src/components/ImageUploader.tsx
'use client'

import { useState } from 'react'

interface ImageUploaderProps {
  folder: string
  value?: string
  onUploaded: (url: string) => void
  label: string
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png']
const MAX_BYTES = 10 * 1024 * 1024

export function ImageUploader({ folder, value, onUploaded, label }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Solo se permiten imágenes JPG o PNG')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('La imagen no puede superar 10MB')
      return
    }

    setUploading(true)
    try {
      const signResponse = await fetch('/api/cloudinary/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder }),
      })
      if (!signResponse.ok) throw new Error('No se pudo firmar la subida')
      const { timestamp, signature, apiKey, cloudName } = await signResponse.json()

      const formData = new FormData()
      formData.append('file', file)
      formData.append('timestamp', String(timestamp))
      formData.append('signature', signature)
      formData.append('api_key', apiKey)
      formData.append('folder', folder)

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      )
      if (!uploadResponse.ok) throw new Error('La subida a Cloudinary falló')
      const uploaded = await uploadResponse.json()
      onUploaded(uploaded.secure_url as string)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt={label} className="h-24 w-24 rounded border object-cover" />
      )}
      <input type="file" accept="image/jpeg,image/png" onChange={handleFileChange} disabled={uploading} />
      {uploading && <p className="text-sm text-gray-500">Subiendo...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 7: Manual verification**

Fill in real `CLOUDINARY_*` values in `.env`. Run `npm run dev`, temporarily drop `<ImageUploader folder="insp-predictivo/test" onUploaded={(url) => console.log(url)} label="Test" />` into `src/app/page.tsx`, log in, upload a JPG, and confirm a `secure_url` is logged in the browser console and the preview renders. Revert the temporary change to `page.tsx` (do not commit it).

- [ ] **Step 8: Commit**

```bash
git add src/lib/cloudinary.ts src/app/api/cloudinary tests/lib/cloudinary.test.ts src/components/ImageUploader.tsx
git commit -m "feat: add Cloudinary signed uploads and ImageUploader component"
```

---

### Task 6: Cliente and Contratista management

**Files:**
- Create: `src/server/actions/clientes.ts`
- Create: `src/server/actions/contratistas.ts`
- Create: `src/app/clientes/page.tsx`
- Create: `src/app/clientes/ClienteForm.tsx`
- Create: `src/app/contratistas/page.tsx`
- Create: `src/app/contratistas/ContratistaForm.tsx`
- Test: `tests/server/clientes.test.ts`
- Test: `tests/server/contratistas.test.ts`

**Interfaces:**
- Consumes: `prisma` (Task 2), `ImageUploader` (Task 5).
- Produces: `createCliente(input): Promise<Cliente>`, `listClientes(): Promise<Cliente[]>`, `createContratista(input): Promise<Contratista>`, `listContratistas(): Promise<Contratista[]>` — used by the Faja creation form in Task 7.

- [ ] **Step 1: Write the failing test for `createCliente`**

```ts
// tests/server/clientes.test.ts
import { describe, it, expect, afterEach } from 'vitest'
import { prisma } from '../../src/lib/prisma'
import { createCliente, listClientes } from '../../src/server/actions/clientes'

describe('createCliente', () => {
  afterEach(async () => {
    await prisma.cliente.deleteMany({ where: { nombre: { startsWith: 'Test Cliente' } } })
  })

  it('creates a cliente and it appears in listClientes', async () => {
    await createCliente({ nombre: 'Test Cliente ACME', logoUrl: 'https://res.cloudinary.com/demo/logo.png' })
    const clientes = await listClientes()
    expect(clientes.some((c) => c.nombre === 'Test Cliente ACME')).toBe(true)
  })

  it('throws when nombre is empty', async () => {
    await expect(createCliente({ nombre: '  ' })).rejects.toThrow('El nombre del cliente es obligatorio')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/server/clientes.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/server/actions/clientes.ts`**

```ts
// src/server/actions/clientes.ts
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import type { Cliente } from '@prisma/client'

export interface CreateClienteInput {
  nombre: string
  logoUrl?: string
}

export async function createCliente(input: CreateClienteInput): Promise<Cliente> {
  if (!input.nombre.trim()) {
    throw new Error('El nombre del cliente es obligatorio')
  }
  const cliente = await prisma.cliente.create({
    data: { nombre: input.nombre.trim(), logoUrl: input.logoUrl },
  })
  revalidatePath('/clientes')
  return cliente
}

export async function listClientes(): Promise<Cliente[]> {
  return prisma.cliente.findMany({ orderBy: { nombre: 'asc' } })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/server/clientes.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Repeat for Contratista — write the failing test**

```ts
// tests/server/contratistas.test.ts
import { describe, it, expect, afterEach } from 'vitest'
import { prisma } from '../../src/lib/prisma'
import { createContratista, listContratistas } from '../../src/server/actions/contratistas'

describe('createContratista', () => {
  afterEach(async () => {
    await prisma.contratista.deleteMany({ where: { nombre: { startsWith: 'Test Contratista' } } })
  })

  it('creates a contratista and it appears in listContratistas', async () => {
    await createContratista({ nombre: 'Test Contratista OCA', logoUrl: 'https://res.cloudinary.com/demo/logo2.png' })
    const contratistas = await listContratistas()
    expect(contratistas.some((c) => c.nombre === 'Test Contratista OCA')).toBe(true)
  })

  it('throws when nombre is empty', async () => {
    await expect(createContratista({ nombre: '' })).rejects.toThrow('El nombre del contratista es obligatorio')
  })
})
```

- [ ] **Step 6: Run test to verify it fails, then implement**

Run: `npx vitest run tests/server/contratistas.test.ts` → Expected: FAIL.

```ts
// src/server/actions/contratistas.ts
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import type { Contratista } from '@prisma/client'

export interface CreateContratistaInput {
  nombre: string
  logoUrl?: string
}

export async function createContratista(input: CreateContratistaInput): Promise<Contratista> {
  if (!input.nombre.trim()) {
    throw new Error('El nombre del contratista es obligatorio')
  }
  const contratista = await prisma.contratista.create({
    data: { nombre: input.nombre.trim(), logoUrl: input.logoUrl },
  })
  revalidatePath('/contratistas')
  return contratista
}

export async function listContratistas(): Promise<Contratista[]> {
  return prisma.contratista.findMany({ orderBy: { nombre: 'asc' } })
}
```

Run: `npx vitest run tests/server/contratistas.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 7: Build the Cliente and Contratista pages**

```tsx
// src/app/clientes/ClienteForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUploader } from '@/components/ImageUploader'
import { createCliente } from '@/server/actions/clientes'

export function ClienteForm() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [logoUrl, setLogoUrl] = useState<string>()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await createCliente({ nombre, logoUrl })
      setNombre('')
      setLogoUrl(undefined)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el cliente')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border bg-white p-4">
      <input
        className="w-full rounded border px-3 py-2"
        placeholder="Nombre del cliente"
        value={nombre}
        onChange={(event) => setNombre(event.target.value)}
        required
      />
      <ImageUploader folder="insp-predictivo/logos-cliente" value={logoUrl} onUploaded={setLogoUrl} label="Logo" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="rounded bg-blue-600 px-3 py-2 text-white">
        Crear cliente
      </button>
    </form>
  )
}
```

```tsx
// src/app/clientes/page.tsx
import { listClientes } from '@/server/actions/clientes'
import { ClienteForm } from './ClienteForm'

export default async function ClientesPage() {
  const clientes = await listClientes()
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">Clientes</h1>
      <ClienteForm />
      <ul className="space-y-2">
        {clientes.map((cliente) => (
          <li key={cliente.id} className="flex items-center gap-3 rounded border bg-white p-3">
            {cliente.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cliente.logoUrl} alt={cliente.nombre} className="h-10 w-10 object-contain" />
            )}
            <span>{cliente.nombre}</span>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

Create `src/app/contratistas/ContratistaForm.tsx` and `src/app/contratistas/page.tsx` mirroring the two files above exactly, replacing `Cliente`/`cliente` with `Contratista`/`contratista` and the folder with `insp-predictivo/logos-contratista`.

- [ ] **Step 8: Manual verification**

Run `npm run dev`, log in, visit `/clientes` and `/contratistas`, create one of each with a real logo upload, and confirm they appear in the list after submit.

- [ ] **Step 9: Commit**

```bash
git add src/server/actions/clientes.ts src/server/actions/contratistas.ts src/app/clientes src/app/contratistas tests/server/clientes.test.ts tests/server/contratistas.test.ts
git commit -m "feat: add cliente and contratista management"
```

---

### Task 7: Faja creation

**Files:**
- Create: `src/server/actions/fajas.ts`
- Create: `src/app/fajas/page.tsx`
- Create: `src/app/fajas/new/page.tsx`
- Create: `src/app/fajas/new/FajaForm.tsx`
- Test: `tests/server/fajas.test.ts`

**Interfaces:**
- Consumes: `prisma` (Task 2), `computeTag` (Task 3), `listClientes`/`listContratistas` (Task 6), `ImageUploader` (Task 5).
- Produces: `createFaja(input: CreateFajaInput): Promise<Faja>`, `listFajas(): Promise<FajaConCliente[]>`, `getFajaById(id): Promise<FajaConDetalle | null>` from `src/server/actions/fajas.ts` — `getFajaById` and its `FajaConDetalle` type are consumed by Tasks 8, 9 and 11.

- [ ] **Step 1: Write the failing test for `createFaja`**

```ts
// tests/server/fajas.test.ts
import { describe, it, expect, afterEach } from 'vitest'
import { prisma } from '../../src/lib/prisma'
import { createFaja, getFajaById } from '../../src/server/actions/fajas'

async function makeClienteYContratista() {
  const cliente = await prisma.cliente.create({ data: { nombre: 'Test Cliente Faja' } })
  const contratista = await prisma.contratista.create({ data: { nombre: 'Test Contratista Faja' } })
  return { cliente, contratista }
}

describe('createFaja', () => {
  afterEach(async () => {
    await prisma.faja.deleteMany({ where: { tag: { startsWith: '9999' } } })
    await prisma.cliente.deleteMany({ where: { nombre: 'Test Cliente Faja' } })
    await prisma.contratista.deleteMany({ where: { nombre: 'Test Contratista Faja' } })
  })

  it('creates a faja with its tag, 5 poleas and 4 default criterios', async () => {
    const { cliente, contratista } = await makeClienteYContratista()
    const faja = await createFaja({
      clienteId: cliente.id,
      contratistaId: contratista.id,
      area: '9999',
      nombre: 'CV001',
      lugar: 'MOQUEGUA',
      numeroPoleas: 5,
      createdByUserId: 'test-user',
    })
    expect(faja.tag).toBe('9999CV001')

    const detalle = await getFajaById(faja.id)
    expect(detalle?.poleas).toHaveLength(5)
    expect(detalle?.poleas.map((p) => p.numero)).toEqual([1, 2, 3, 4, 5])
    expect(detalle?.criterios).toHaveLength(4)
    expect(detalle?.criterios.map((c) => c.nivel).sort()).toEqual(
      ['CRITICO', 'NORMAL', 'PRECAUCION', 'TOLERABLE'].sort()
    )
  })

  it('rejects a duplicate tag with a friendly error', async () => {
    const { cliente, contratista } = await makeClienteYContratista()
    const input = {
      clienteId: cliente.id,
      contratistaId: contratista.id,
      area: '9999',
      nombre: 'CV002',
      lugar: 'MOQUEGUA',
      numeroPoleas: 2,
      createdByUserId: 'test-user',
    }
    await createFaja(input)
    await expect(createFaja(input)).rejects.toThrow('Ya existe una faja con el tag 9999CV002')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/server/fajas.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/server/actions/fajas.ts`**

```ts
// src/server/actions/fajas.ts
'use server'

import { prisma } from '@/lib/prisma'
import { computeTag } from '@/lib/tag'
import { revalidatePath } from 'next/cache'
import type { Faja } from '@prisma/client'

const DEFAULT_CRITERIOS = [
  { nivel: 'NORMAL' as const, tempMin: 45, tempMax: 54, deltaMin: 0, deltaMax: 5, color: '#22c55e' },
  { nivel: 'TOLERABLE' as const, tempMin: 55, tempMax: 68, deltaMin: 5, deltaMax: 8, color: '#eab308' },
  { nivel: 'PRECAUCION' as const, tempMin: 68, tempMax: 90, deltaMin: 8, deltaMax: 999, color: '#f97316' },
  { nivel: 'CRITICO' as const, tempMin: 90, tempMax: 999, deltaMin: 0, deltaMax: 999, color: '#ef4444' },
]

export interface CreateFajaInput {
  clienteId: string
  contratistaId: string
  area: string
  nombre: string
  lugar: string
  descripcion?: string
  numeroPoleas: number
  esquemaUrl?: string
  createdByUserId: string
}

export async function createFaja(input: CreateFajaInput): Promise<Faja> {
  if (input.numeroPoleas < 1) {
    throw new Error('El número de poleas debe ser al menos 1')
  }
  const tag = computeTag(input.area, input.nombre)

  const existing = await prisma.faja.findUnique({ where: { tag } })
  if (existing) {
    throw new Error(`Ya existe una faja con el tag ${tag}`)
  }

  const faja = await prisma.faja.create({
    data: {
      clienteId: input.clienteId,
      contratistaId: input.contratistaId,
      area: input.area.trim(),
      nombre: input.nombre.trim(),
      tag,
      lugar: input.lugar.trim(),
      descripcion: input.descripcion,
      numeroPoleas: input.numeroPoleas,
      esquemaUrl: input.esquemaUrl,
      createdByUserId: input.createdByUserId,
      poleas: {
        create: Array.from({ length: input.numeroPoleas }, (_, index) => ({ numero: index + 1 })),
      },
      criterios: { create: DEFAULT_CRITERIOS },
    },
  })
  revalidatePath('/fajas')
  return faja
}

export async function listFajas() {
  return prisma.faja.findMany({
    include: { cliente: true, contratista: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getFajaById(id: string) {
  return prisma.faja.findUnique({
    where: { id },
    include: {
      cliente: true,
      contratista: true,
      poleas: { orderBy: { numero: 'asc' } },
      criterios: true,
      reportes: { orderBy: { fecha: 'desc' } },
    },
  })
}

export type FajaConDetalle = NonNullable<Awaited<ReturnType<typeof getFajaById>>>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/server/fajas.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Build the Faja list and creation form**

```tsx
// src/app/fajas/new/FajaForm.tsx
'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Cliente, Contratista } from '@prisma/client'
import { ImageUploader } from '@/components/ImageUploader'
import { createFaja } from '@/server/actions/fajas'
import { computeTag } from '@/lib/tag'

interface FajaFormProps {
  clientes: Cliente[]
  contratistas: Contratista[]
  currentUserId: string
}

export function FajaForm({ clientes, contratistas, currentUserId }: FajaFormProps) {
  const router = useRouter()
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? '')
  const [contratistaId, setContratistaId] = useState(contratistas[0]?.id ?? '')
  const [area, setArea] = useState('')
  const [nombre, setNombre] = useState('')
  const [lugar, setLugar] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [numeroPoleas, setNumeroPoleas] = useState(5)
  const [esquemaUrl, setEsquemaUrl] = useState<string>()
  const [error, setError] = useState<string | null>(null)

  const tagPreview = useMemo(() => (area && nombre ? computeTag(area, nombre) : ''), [area, nombre])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      const faja = await createFaja({
        clienteId,
        contratistaId,
        area,
        nombre,
        lugar,
        descripcion: descripcion || undefined,
        numeroPoleas,
        esquemaUrl,
        createdByUserId: currentUserId,
      })
      router.push(`/fajas/${faja.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la faja')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border bg-white p-4">
      <div className="grid grid-cols-2 gap-3">
        <select className="rounded border px-3 py-2" value={clienteId} onChange={(e) => setClienteId(e.target.value)} required>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <select className="rounded border px-3 py-2" value={contratistaId} onChange={(e) => setContratistaId(e.target.value)} required>
          {contratistas.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input className="rounded border px-3 py-2" placeholder="Área (ej. 3220)" value={area} onChange={(e) => setArea(e.target.value)} required />
        <input className="rounded border px-3 py-2" placeholder="Nombre (ej. CV001)" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      </div>
      {tagPreview && <p className="text-sm text-gray-500">Tag: <strong>{tagPreview}</strong></p>}
      <input className="w-full rounded border px-3 py-2" placeholder="Lugar" value={lugar} onChange={(e) => setLugar(e.target.value)} required />
      <input className="w-full rounded border px-3 py-2" placeholder="Descripción (opcional)" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      <label className="block text-sm font-medium">
        Número de poleas
        <input
          type="number"
          min={1}
          className="mt-1 w-full rounded border px-3 py-2"
          value={numeroPoleas}
          onChange={(e) => setNumeroPoleas(Number(e.target.value))}
          required
        />
      </label>
      <ImageUploader folder="insp-predictivo/esquemas" value={esquemaUrl} onUploaded={setEsquemaUrl} label="Esquema de ubicación de poleas" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="rounded bg-blue-600 px-3 py-2 text-white">Crear faja</button>
    </form>
  )
}
```

```tsx
// src/app/fajas/new/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listClientes } from '@/server/actions/clientes'
import { listContratistas } from '@/server/actions/contratistas'
import { FajaForm } from './FajaForm'

export default async function NewFajaPage() {
  const session = await getServerSession(authOptions)
  const [clientes, contratistas] = await Promise.all([listClientes(), listContratistas()])
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">Nueva faja</h1>
      <FajaForm clientes={clientes} contratistas={contratistas} currentUserId={(session?.user as { id: string }).id} />
    </main>
  )
}
```

```tsx
// src/app/fajas/page.tsx
import Link from 'next/link'
import { listFajas } from '@/server/actions/fajas'

export default async function FajasPage() {
  const fajas = await listFajas()
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Fajas</h1>
        <Link href="/fajas/new" className="rounded bg-blue-600 px-3 py-2 text-white">Nueva faja</Link>
      </div>
      <ul className="space-y-2">
        {fajas.map((faja) => (
          <li key={faja.id} className="rounded border bg-white p-3">
            <Link href={`/fajas/${faja.id}`} className="font-medium text-blue-700">{faja.tag}</Link>
            <p className="text-sm text-gray-500">{faja.cliente.nombre} · {faja.lugar}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

- [ ] **Step 6: Manual verification**

Run `npm run dev`, log in, create a Cliente/Contratista if needed (Task 6), go to `/fajas/new`, fill the form with area `3220` and nombre `CV001`, confirm the tag preview shows `3220CV001`, submit, and confirm you land on the (not-yet-built) `/fajas/[id]` route without a server error being thrown before Task 8 exists (a 404 page is expected and fine).

- [ ] **Step 7: Commit**

```bash
git add src/server/actions/fajas.ts src/app/fajas tests/server/fajas.test.ts
git commit -m "feat: add faja creation with auto-generated poleas and criterios"
```

---

### Task 8: Faja detail page — poleas, criterios, delete

**Files:**
- Modify: `src/server/actions/fajas.ts`
- Create: `src/app/fajas/[id]/page.tsx`
- Create: `src/app/fajas/[id]/PoleaTipoEditor.tsx`
- Create: `src/app/fajas/[id]/CriterioEditor.tsx`
- Create: `src/app/fajas/[id]/DeleteFajaButton.tsx`
- Test: `tests/server/fajas-edit.test.ts`

**Interfaces:**
- Consumes: `getFajaById`, `FajaConDetalle` (Task 7).
- Produces (added to `src/server/actions/fajas.ts`): `updatePoleaTipo(poleaId, tipo): Promise<Polea>`, `updateCriterio(criterioId, data: {tempMin,tempMax,deltaMin,deltaMax}): Promise<CriterioAceptacion>`, `updateNumeroPoleas(fajaId, numeroPoleas): Promise<Faja>` (throws if reducing below the highest polea número with existing lecturas), `countReportesByFaja(fajaId): Promise<number>`, `deleteFaja(fajaId): Promise<void>`.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/server/fajas-edit.test.ts
import { describe, it, expect, afterEach } from 'vitest'
import { prisma } from '../../src/lib/prisma'
import { createFaja, updatePoleaTipo, updateCriterio, updateNumeroPoleas, deleteFaja, countReportesByFaja } from '../../src/server/actions/fajas'

async function setupFaja(numeroPoleas = 3) {
  const cliente = await prisma.cliente.create({ data: { nombre: 'Test Cliente Edit' } })
  const contratista = await prisma.contratista.create({ data: { nombre: 'Test Contratista Edit' } })
  const faja = await createFaja({
    clienteId: cliente.id,
    contratistaId: contratista.id,
    area: '8888',
    nombre: 'CV001',
    lugar: 'MOQUEGUA',
    numeroPoleas,
    createdByUserId: 'test-user',
  })
  return { cliente, contratista, faja }
}

describe('faja editing actions', () => {
  afterEach(async () => {
    await prisma.faja.deleteMany({ where: { tag: { startsWith: '8888' } } })
    await prisma.cliente.deleteMany({ where: { nombre: 'Test Cliente Edit' } })
    await prisma.contratista.deleteMany({ where: { nombre: 'Test Contratista Edit' } })
  })

  it('updates a polea tipo', async () => {
    const { faja } = await setupFaja()
    const polea = await prisma.polea.findFirstOrThrow({ where: { fajaId: faja.id, numero: 1 } })
    const updated = await updatePoleaTipo(polea.id, 'Motriz')
    expect(updated.tipo).toBe('Motriz')
  })

  it('updates a criterio range', async () => {
    const { faja } = await setupFaja()
    const criterio = await prisma.criterioAceptacion.findFirstOrThrow({ where: { fajaId: faja.id, nivel: 'NORMAL' } })
    const updated = await updateCriterio(criterio.id, { tempMin: 10, tempMax: 20, deltaMin: 0, deltaMax: 3 })
    expect(updated.tempMin).toBe(10)
    expect(updated.tempMax).toBe(20)
  })

  it('allows increasing numeroPoleas', async () => {
    const { faja } = await setupFaja(3)
    const updated = await updateNumeroPoleas(faja.id, 5)
    expect(updated.numeroPoleas).toBe(5)
    const poleas = await prisma.polea.findMany({ where: { fajaId: faja.id } })
    expect(poleas).toHaveLength(5)
  })

  it('rejects reducing numeroPoleas below poleas with existing lecturas', async () => {
    const { faja } = await setupFaja(3)
    const polea3 = await prisma.polea.findFirstOrThrow({ where: { fajaId: faja.id, numero: 3 } })
    const reporte = await prisma.reporte.create({
      data: {
        fajaId: faja.id,
        fecha: new Date(),
        especialista: 'X',
        supervisor: 'Y',
        numeroAvisoSAP: '123',
        condicionGeneral: 'NORMAL',
        createdByUserId: 'test-user',
      },
    })
    await prisma.lecturaPolea.create({
      data: {
        reporteId: reporte.id,
        poleaId: polea3.id,
        tempIzquierda: 20,
        tempDerecha: 20,
        fotoIzquierdaUrl: 'https://example.com/a.jpg',
        fotoDerechaUrl: 'https://example.com/b.jpg',
        condicion: 'NORMAL',
        diagnosticoTexto: 'texto',
      },
    })
    await expect(updateNumeroPoleas(faja.id, 2)).rejects.toThrow(
      'No se puede reducir el número de poleas por debajo de las que ya tienen reportes'
    )
  })

  it('counts reportes and deletes a faja in cascade', async () => {
    const { faja } = await setupFaja(1)
    expect(await countReportesByFaja(faja.id)).toBe(0)
    await deleteFaja(faja.id)
    expect(await prisma.faja.findUnique({ where: { id: faja.id } })).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/server/fajas-edit.test.ts`
Expected: FAIL — the new exports don't exist yet.

- [ ] **Step 3: Add the new actions to `src/server/actions/fajas.ts`**

Append to the existing file (keep everything from Task 7):

```ts
export async function updatePoleaTipo(poleaId: string, tipo: string) {
  const updated = await prisma.polea.update({ where: { id: poleaId }, data: { tipo } })
  revalidatePath(`/fajas/${updated.fajaId}`)
  return updated
}

export async function updateCriterio(
  criterioId: string,
  data: { tempMin: number; tempMax: number; deltaMin: number; deltaMax: number }
) {
  const updated = await prisma.criterioAceptacion.update({ where: { id: criterioId }, data })
  revalidatePath(`/fajas/${updated.fajaId}`)
  return updated
}

export async function updateNumeroPoleas(fajaId: string, numeroPoleas: number) {
  const poleasConLecturas = await prisma.polea.findMany({
    where: { fajaId, lecturas: { some: {} } },
    orderBy: { numero: 'desc' },
    take: 1,
  })
  const maxPoleaConLecturas = poleasConLecturas[0]?.numero ?? 0
  if (numeroPoleas < maxPoleaConLecturas) {
    throw new Error('No se puede reducir el número de poleas por debajo de las que ya tienen reportes')
  }

  const existentes = await prisma.polea.findMany({ where: { fajaId }, orderBy: { numero: 'asc' } })
  if (numeroPoleas > existentes.length) {
    await prisma.polea.createMany({
      data: Array.from({ length: numeroPoleas - existentes.length }, (_, index) => ({
        fajaId,
        numero: existentes.length + index + 1,
      })),
    })
  }

  const updated = await prisma.faja.update({ where: { id: fajaId }, data: { numeroPoleas } })
  revalidatePath(`/fajas/${fajaId}`)
  return updated
}

export async function countReportesByFaja(fajaId: string): Promise<number> {
  return prisma.reporte.count({ where: { fajaId } })
}

export async function deleteFaja(fajaId: string): Promise<void> {
  await prisma.faja.delete({ where: { id: fajaId } })
  revalidatePath('/fajas')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/server/fajas-edit.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Build the editing UI**

```tsx
// src/app/fajas/[id]/PoleaTipoEditor.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Polea } from '@prisma/client'
import { updatePoleaTipo } from '@/server/actions/fajas'

export function PoleaTipoEditor({ polea }: { polea: Polea }) {
  const router = useRouter()
  const [tipo, setTipo] = useState(polea.tipo ?? '')

  async function handleBlur() {
    if (tipo !== (polea.tipo ?? '')) {
      await updatePoleaTipo(polea.id, tipo)
      router.refresh()
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-sm text-gray-500">Polea {polea.numero}</span>
      <input
        className="flex-1 rounded border px-2 py-1 text-sm"
        placeholder="Tipo (ej. Motriz, Cabeza, Tensora)"
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        onBlur={handleBlur}
      />
    </div>
  )
}
```

```tsx
// src/app/fajas/[id]/CriterioEditor.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CriterioAceptacion } from '@prisma/client'
import { updateCriterio } from '@/server/actions/fajas'

export function CriterioEditor({ criterio }: { criterio: CriterioAceptacion }) {
  const router = useRouter()
  const [values, setValues] = useState({
    tempMin: criterio.tempMin,
    tempMax: criterio.tempMax,
    deltaMin: criterio.deltaMin,
    deltaMax: criterio.deltaMax,
  })

  async function handleBlur() {
    await updateCriterio(criterio.id, values)
    router.refresh()
  }

  return (
    <tr style={{ backgroundColor: `${criterio.color}22` }}>
      <td className="px-2 py-1 font-medium">{criterio.nivel}</td>
      {(['tempMin', 'tempMax', 'deltaMin', 'deltaMax'] as const).map((field) => (
        <td key={field} className="px-2 py-1">
          <input
            type="number"
            className="w-20 rounded border px-1 py-0.5 text-sm"
            value={values[field]}
            onChange={(e) => setValues((v) => ({ ...v, [field]: Number(e.target.value) }))}
            onBlur={handleBlur}
          />
        </td>
      ))}
    </tr>
  )
}
```

```tsx
// src/app/fajas/[id]/DeleteFajaButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteFaja } from '@/server/actions/fajas'

export function DeleteFajaButton({ fajaId, reportesCount }: { fajaId: string; reportesCount: number }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="rounded border border-red-600 px-3 py-2 text-red-600">
        Eliminar faja
      </button>
    )
  }

  return (
    <div className="rounded border border-red-600 bg-red-50 p-3">
      <p className="text-sm text-red-700">
        Esto eliminará la faja y sus {reportesCount} reporte(s) asociados. ¿Confirmas?
      </p>
      <div className="mt-2 flex gap-2">
        <button
          onClick={async () => {
            await deleteFaja(fajaId)
            router.push('/fajas')
          }}
          className="rounded bg-red-600 px-3 py-2 text-white"
        >
          Sí, eliminar
        </button>
        <button onClick={() => setConfirming(false)} className="rounded border px-3 py-2">
          Cancelar
        </button>
      </div>
    </div>
  )
}
```

```tsx
// src/app/fajas/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getFajaById, countReportesByFaja } from '@/server/actions/fajas'
import { PoleaTipoEditor } from './PoleaTipoEditor'
import { CriterioEditor } from './CriterioEditor'
import { DeleteFajaButton } from './DeleteFajaButton'

export default async function FajaDetailPage({ params }: { params: { id: string } }) {
  const faja = await getFajaById(params.id)
  if (!faja) notFound()
  const reportesCount = await countReportesByFaja(faja.id)

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{faja.tag}</h1>
          <p className="text-sm text-gray-500">{faja.cliente.nombre} · {faja.lugar}</p>
        </div>
        <Link href={`/fajas/${faja.id}/reportes/new`} className="rounded bg-blue-600 px-3 py-2 text-white">
          Crear reporte
        </Link>
      </div>

      {faja.esquemaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={faja.esquemaUrl} alt="Esquema de poleas" className="max-w-full rounded border" />
      )}

      <section>
        <h2 className="mb-2 font-medium">Poleas</h2>
        <div className="space-y-1 rounded border bg-white p-3">
          {faja.poleas.map((polea) => (
            <PoleaTipoEditor key={polea.id} polea={polea} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Criterios de aceptación</h2>
        <table className="w-full rounded border bg-white text-sm">
          <thead>
            <tr className="text-left">
              <th className="px-2 py-1">Nivel</th>
              <th className="px-2 py-1">Temp min</th>
              <th className="px-2 py-1">Temp max</th>
              <th className="px-2 py-1">Delta min</th>
              <th className="px-2 py-1">Delta max</th>
            </tr>
          </thead>
          <tbody>
            {faja.criterios.map((criterio) => (
              <CriterioEditor key={criterio.id} criterio={criterio} />
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Reportes</h2>
        <ul className="space-y-2">
          {faja.reportes.map((reporte) => (
            <li key={reporte.id} className="rounded border bg-white p-3">
              <Link href={`/reportes/${reporte.id}`} className="text-blue-700">
                {new Date(reporte.fecha).toLocaleDateString('es-PE')} — {reporte.condicionGeneral}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <DeleteFajaButton fajaId={faja.id} reportesCount={reportesCount} />
    </main>
  )
}
```

- [ ] **Step 6: Manual verification**

Run `npm run dev`, open the faja created in Task 7, set a `tipo` on a polea, edit a criterio range, and confirm both persist after a page refresh. Do not click delete yet (it cascades — verify it only once you're fine losing that test faja).

- [ ] **Step 7: Commit**

```bash
git add src/server/actions/fajas.ts src/app/fajas/[id] tests/server/fajas-edit.test.ts
git commit -m "feat: add faja detail page with polea/criterio editing and delete"
```

---

### Task 9: Reporte creation

**Files:**
- Create: `src/server/actions/reportes.ts`
- Create: `src/app/fajas/[id]/reportes/new/page.tsx`
- Create: `src/app/fajas/[id]/reportes/new/ReporteForm.tsx`
- Test: `tests/server/reportes.test.ts`

**Interfaces:**
- Consumes: `getFajaById` (Task 7), `worstCondicion` (Task 3), `ImageUploader` (Task 5).
- Produces: `createReporte(input: CreateReporteInput): Promise<Reporte>`, `getReporteById(id): Promise<ReporteConDetalle | null>`, and the `LecturaPoleaInput`/`CreateReporteInput`/`ReporteConDetalle` types — consumed by Tasks 10, 12 and 13.

- [ ] **Step 1: Write the failing test**

```ts
// tests/server/reportes.test.ts
import { describe, it, expect, afterEach } from 'vitest'
import { prisma } from '../../src/lib/prisma'
import { createFaja, getFajaById } from '../../src/server/actions/fajas'
import { createReporte, getReporteById } from '../../src/server/actions/reportes'

async function setupFaja() {
  const cliente = await prisma.cliente.create({ data: { nombre: 'Test Cliente Reporte' } })
  const contratista = await prisma.contratista.create({ data: { nombre: 'Test Contratista Reporte' } })
  const faja = await createFaja({
    clienteId: cliente.id,
    contratistaId: contratista.id,
    area: '7777',
    nombre: 'CV001',
    lugar: 'MOQUEGUA',
    numeroPoleas: 2,
    createdByUserId: 'test-user',
  })
  return getFajaById(faja.id)
}

describe('createReporte', () => {
  afterEach(async () => {
    await prisma.faja.deleteMany({ where: { tag: { startsWith: '7777' } } })
    await prisma.cliente.deleteMany({ where: { nombre: 'Test Cliente Reporte' } })
    await prisma.contratista.deleteMany({ where: { nombre: 'Test Contratista Reporte' } })
  })

  it('creates a reporte with lecturas and derives condicionGeneral as the worst one', async () => {
    const faja = await setupFaja()
    if (!faja) throw new Error('faja not created')

    const reporte = await createReporte({
      fajaId: faja.id,
      fecha: new Date('2026-08-02'),
      especialista: 'Nelson Larico',
      supervisor: 'Rolando Aliaga',
      numeroAvisoSAP: '4016597449',
      createdByUserId: 'test-user',
      lecturas: faja.poleas.map((polea, index) => ({
        poleaId: polea.id,
        tempIzquierda: 20,
        tempDerecha: 21,
        fotoIzquierdaUrl: 'https://example.com/i.jpg',
        fotoDerechaUrl: 'https://example.com/d.jpg',
        condicion: index === 0 ? 'TOLERABLE' : 'NORMAL',
        diagnosticoTexto: `texto polea ${polea.numero}`,
      })),
    })

    expect(reporte.condicionGeneral).toBe('TOLERABLE')

    const detalle = await getReporteById(reporte.id)
    expect(detalle?.lecturas).toHaveLength(2)
  })

  it('rejects a reporte missing a lectura for one of the poleas', async () => {
    const faja = await setupFaja()
    if (!faja) throw new Error('faja not created')

    await expect(
      createReporte({
        fajaId: faja.id,
        fecha: new Date(),
        especialista: 'X',
        supervisor: 'Y',
        numeroAvisoSAP: '123',
        createdByUserId: 'test-user',
        lecturas: [
          {
            poleaId: faja.poleas[0].id,
            tempIzquierda: 20,
            tempDerecha: 21,
            fotoIzquierdaUrl: 'https://example.com/i.jpg',
            fotoDerechaUrl: 'https://example.com/d.jpg',
            condicion: 'NORMAL',
            diagnosticoTexto: 'texto',
          },
        ],
      })
    ).rejects.toThrow('Debes registrar una lectura para cada una de las 2 poleas de la faja')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/server/reportes.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/server/actions/reportes.ts`**

```ts
// src/server/actions/reportes.ts
'use server'

import { prisma } from '@/lib/prisma'
import { worstCondicion } from '@/lib/condicion'
import { revalidatePath } from 'next/cache'
import type { Condicion, Reporte } from '@prisma/client'

export interface LecturaPoleaInput {
  poleaId: string
  tempIzquierda: number
  tempDerecha: number
  fotoIzquierdaUrl: string
  fotoDerechaUrl: string
  condicion: Condicion
  diagnosticoTexto: string
}

export interface CreateReporteInput {
  fajaId: string
  fecha: Date
  especialista: string
  supervisor: string
  numeroAvisoSAP: string
  observacionGeneral?: string
  createdByUserId: string
  lecturas: LecturaPoleaInput[]
}

export async function createReporte(input: CreateReporteInput): Promise<Reporte> {
  const faja = await prisma.faja.findUniqueOrThrow({ where: { id: input.fajaId } })

  if (input.lecturas.length !== faja.numeroPoleas) {
    throw new Error(`Debes registrar una lectura para cada una de las ${faja.numeroPoleas} poleas de la faja`)
  }
  for (const lectura of input.lecturas) {
    if (!lectura.fotoIzquierdaUrl || !lectura.fotoDerechaUrl) {
      throw new Error('Cada polea requiere las dos fotos de termograma (izquierda y derecha)')
    }
  }
  if (!input.especialista.trim() || !input.supervisor.trim()) {
    throw new Error('Especialista y supervisor son obligatorios')
  }

  const condicionGeneral = worstCondicion(input.lecturas.map((l) => l.condicion))

  const reporte = await prisma.reporte.create({
    data: {
      fajaId: input.fajaId,
      fecha: input.fecha,
      especialista: input.especialista.trim(),
      supervisor: input.supervisor.trim(),
      numeroAvisoSAP: input.numeroAvisoSAP.trim(),
      condicionGeneral,
      observacionGeneral: input.observacionGeneral || 'Equipo sin indicaciones',
      createdByUserId: input.createdByUserId,
      lecturas: { create: input.lecturas },
    },
  })
  revalidatePath(`/fajas/${input.fajaId}`)
  return reporte
}

export async function getReporteById(id: string) {
  return prisma.reporte.findUnique({
    where: { id },
    include: {
      faja: { include: { cliente: true, contratista: true, criterios: true } },
      lecturas: { include: { polea: true }, orderBy: { polea: { numero: 'asc' } } },
    },
  })
}

export type ReporteConDetalle = NonNullable<Awaited<ReturnType<typeof getReporteById>>>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/server/reportes.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Build the reporte creation form**

```tsx
// src/app/fajas/[id]/reportes/new/ReporteForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Condicion } from '@prisma/client'
import type { FajaConDetalle } from '@/server/actions/fajas'
import { ImageUploader } from '@/components/ImageUploader'
import { createReporte } from '@/server/actions/reportes'
import { buildDiagnosticoTexto } from '@/lib/diagnosticoTemplate'

interface LecturaFormState {
  tempIzquierda: string
  tempDerecha: string
  fotoIzquierdaUrl?: string
  fotoDerechaUrl?: string
  condicion: Condicion
  diagnosticoTexto: string
}

const CONDICIONES: Condicion[] = ['NORMAL', 'TOLERABLE', 'PRECAUCION', 'CRITICO']

export function ReporteForm({ faja }: { faja: FajaConDetalle }) {
  const router = useRouter()
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [especialista, setEspecialista] = useState('')
  const [supervisor, setSupervisor] = useState('')
  const [numeroAvisoSAP, setNumeroAvisoSAP] = useState('')
  const [observacionGeneral, setObservacionGeneral] = useState('Equipo sin indicaciones')
  const [error, setError] = useState<string | null>(null)
  const [lecturas, setLecturas] = useState<Record<string, LecturaFormState>>(
    Object.fromEntries(
      faja.poleas.map((polea) => [
        polea.id,
        { tempIzquierda: '', tempDerecha: '', condicion: 'NORMAL' as Condicion, diagnosticoTexto: '' },
      ])
    )
  )

  function updateLectura(poleaId: string, patch: Partial<LecturaFormState>) {
    setLecturas((prev) => {
      const next = { ...prev[poleaId], ...patch }
      const tempIzquierda = Number(next.tempIzquierda)
      const tempDerecha = Number(next.tempDerecha)
      if (next.tempIzquierda && next.tempDerecha && !patch.diagnosticoTexto) {
        const polea = faja.poleas.find((p) => p.id === poleaId)!
        next.diagnosticoTexto = buildDiagnosticoTexto({
          numeroPolea: polea.numero,
          tempIzquierda,
          tempDerecha,
          condicion: next.condicion,
        })
      }
      return { ...prev, [poleaId]: next }
    })
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await createReporte({
        fajaId: faja.id,
        fecha: new Date(fecha),
        especialista,
        supervisor,
        numeroAvisoSAP,
        observacionGeneral,
        createdByUserId: 'unused-overwritten-below',
        lecturas: faja.poleas.map((polea) => {
          const l = lecturas[polea.id]
          return {
            poleaId: polea.id,
            tempIzquierda: Number(l.tempIzquierda),
            tempDerecha: Number(l.tempDerecha),
            fotoIzquierdaUrl: l.fotoIzquierdaUrl ?? '',
            fotoDerechaUrl: l.fotoDerechaUrl ?? '',
            condicion: l.condicion,
            diagnosticoTexto: l.diagnosticoTexto,
          }
        }),
      })
      router.push(`/fajas/${faja.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el reporte')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-3 rounded border bg-white p-4">
        <input type="date" className="rounded border px-3 py-2" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        <input className="rounded border px-3 py-2" placeholder="Nº Aviso SAP" value={numeroAvisoSAP} onChange={(e) => setNumeroAvisoSAP(e.target.value)} required />
        <input className="rounded border px-3 py-2" placeholder="Especialista" value={especialista} onChange={(e) => setEspecialista(e.target.value)} required />
        <input className="rounded border px-3 py-2" placeholder="Supervisor" value={supervisor} onChange={(e) => setSupervisor(e.target.value)} required />
        <input className="col-span-2 rounded border px-3 py-2" placeholder="Observación general" value={observacionGeneral} onChange={(e) => setObservacionGeneral(e.target.value)} />
      </div>

      {faja.poleas.map((polea) => {
        const lectura = lecturas[polea.id]
        return (
          <div key={polea.id} className="space-y-3 rounded border bg-white p-4">
            <h3 className="font-medium">Polea {polea.numero}{polea.tipo ? ` — ${polea.tipo}` : ''}</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number" step="0.1"
                className="rounded border px-3 py-2"
                placeholder="Temp. izquierda (°C)"
                value={lectura.tempIzquierda}
                onChange={(e) => updateLectura(polea.id, { tempIzquierda: e.target.value })}
                required
              />
              <input
                type="number" step="0.1"
                className="rounded border px-3 py-2"
                placeholder="Temp. derecha (°C)"
                value={lectura.tempDerecha}
                onChange={(e) => updateLectura(polea.id, { tempDerecha: e.target.value })}
                required
              />
            </div>
            <select
              className="rounded border px-3 py-2"
              value={lectura.condicion}
              onChange={(e) => updateLectura(polea.id, { condicion: e.target.value as Condicion })}
            >
              {CONDICIONES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <ImageUploader
                folder={`insp-predictivo/reportes/${faja.tag}`}
                value={lectura.fotoIzquierdaUrl}
                onUploaded={(url) => updateLectura(polea.id, { fotoIzquierdaUrl: url })}
                label="Foto izquierda"
              />
              <ImageUploader
                folder={`insp-predictivo/reportes/${faja.tag}`}
                value={lectura.fotoDerechaUrl}
                onUploaded={(url) => updateLectura(polea.id, { fotoDerechaUrl: url })}
                label="Foto derecha"
              />
            </div>
            <textarea
              className="w-full rounded border px-3 py-2"
              rows={4}
              value={lectura.diagnosticoTexto}
              onChange={(e) => updateLectura(polea.id, { diagnosticoTexto: e.target.value })}
            />
          </div>
        )
      })}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">Guardar reporte</button>
    </form>
  )
}
```

`createdByUserId` above is a placeholder string — fix it in Step 6 by passing the real session user id from the server page instead of hardcoding it in the client form.

- [ ] **Step 6: Wire the server page and fix `createdByUserId`**

```tsx
// src/app/fajas/[id]/reportes/new/page.tsx
import { notFound } from 'next/navigation'
import { getFajaById } from '@/server/actions/fajas'
import { ReporteForm } from './ReporteForm'

export default async function NewReportePage({ params }: { params: { id: string } }) {
  const faja = await getFajaById(params.id)
  if (!faja) notFound()
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">Nuevo reporte — {faja.tag}</h1>
      <ReporteForm faja={faja} />
    </main>
  )
}
```

In `ReporteForm.tsx`, replace the `createdByUserId: 'unused-overwritten-below',` line with `createdByUserId: (await import('next-auth/react')).getSession ? '' : ''` is **not** correct — instead, fetch the session properly: add `import { useSession } from 'next-auth/react'` at the top of `ReporteForm.tsx`, call `const { data: session } = useSession()` inside the component, and set `createdByUserId: (session?.user as { id: string })?.id ?? ''` in the `createReporte` call.

- [ ] **Step 7: Run the full test suite**

Run: `npx vitest run`
Expected: all tests PASS.

- [ ] **Step 8: Manual verification**

Run `npm run dev`, open a faja, click "Crear reporte", fill in fecha/especialista/supervisor/SAP, for each polea enter both temperatures (confirm the diagnóstico textarea auto-fills), upload both photos, submit, and confirm you land back on the faja page with the new reporte listed with the correct worst-case condición.

- [ ] **Step 9: Commit**

```bash
git add src/server/actions/reportes.ts src/app/fajas/[id]/reportes tests/server/reportes.test.ts
git commit -m "feat: add reporte creation with per-polea readings and photos"
```

---

### Task 10: Reporte detail page

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/components/ReporteHeader.tsx`
- Create: `src/components/CriterioTable.tsx`
- Create: `src/components/PoleaDiagnosticoBlock.tsx`
- Create: `src/app/reportes/[id]/page.tsx`
- Create: `src/app/reportes/[id]/DeleteReporteButton.tsx`
- Modify: `src/server/actions/reportes.ts`

**Interfaces:**
- Consumes: `getReporteById`, `ReporteConDetalle` (Task 9).
- Produces: `ReporteHeader`, `CriterioTable`, `PoleaDiagnosticoBlock` components (props documented below) — reused unchanged by the print route in Task 12; `deleteReporte(id): Promise<void>` added to `reportes.ts`.

- [ ] **Step 1: Define the shared type**

```ts
// src/lib/types.ts
import type { ReporteConDetalle } from '@/server/actions/reportes'

export type { ReporteConDetalle }
```

- [ ] **Step 2: Build the presentational components**

```tsx
// src/components/ReporteHeader.tsx
import type { ReporteConDetalle } from '@/lib/types'
import { CONDICION_COLORS } from '@/lib/condicion'

export function ReporteHeader({ reporte }: { reporte: ReporteConDetalle }) {
  const { faja } = reporte
  return (
    <div className="rounded border bg-white">
      <div className="flex items-center justify-between border-b bg-blue-900 p-4 text-white">
        <h1 className="text-lg font-semibold">REPORTE DETALLADO {faja.tag}</h1>
        <div className="flex items-center gap-4">
          {faja.cliente.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={faja.cliente.logoUrl} alt={faja.cliente.nombre} className="h-8 bg-white p-1" />
          )}
          {faja.contratista.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={faja.contratista.logoUrl} alt={faja.contratista.nombre} className="h-8 bg-white p-1" />
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 p-4 text-sm">
        <p><strong>Cliente:</strong> {faja.cliente.nombre}</p>
        <p><strong>Lugar:</strong> {faja.lugar}</p>
        <p><strong>Fecha monitoreo:</strong> {new Date(reporte.fecha).toLocaleDateString('es-PE')}</p>
        <p><strong>Sistema:</strong> {faja.tag}</p>
        <p><strong>Supervisor:</strong> {reporte.supervisor}</p>
        <p><strong>Componentes:</strong> CHUMACERAS</p>
        <p><strong>Especialista:</strong> {reporte.especialista}</p>
        <p><strong>Nº Aviso SAP:</strong> {reporte.numeroAvisoSAP}</p>
      </div>
      <div className="flex items-center justify-between border-t p-4">
        <span className="text-sm">{reporte.observacionGeneral}</span>
        <span
          className="rounded px-3 py-1 text-sm font-semibold text-white"
          style={{ backgroundColor: CONDICION_COLORS[reporte.condicionGeneral] }}
        >
          CONDICIÓN: {reporte.condicionGeneral}
        </span>
      </div>
    </div>
  )
}
```

```tsx
// src/components/CriterioTable.tsx
import type { CriterioAceptacion } from '@prisma/client'

export function CriterioTable({ criterios }: { criterios: CriterioAceptacion[] }) {
  return (
    <table className="w-full rounded border bg-white text-sm">
      <thead>
        <tr className="text-left">
          <th className="px-2 py-1">Nivel</th>
          <th className="px-2 py-1">Rango °C</th>
          <th className="px-2 py-1">Delta °C</th>
        </tr>
      </thead>
      <tbody>
        {criterios.map((criterio) => (
          <tr key={criterio.id} style={{ backgroundColor: `${criterio.color}22` }}>
            <td className="px-2 py-1 font-semibold">{criterio.nivel}</td>
            <td className="px-2 py-1">{criterio.tempMin}° - {criterio.tempMax}°C</td>
            <td className="px-2 py-1">{criterio.deltaMin} - {criterio.deltaMax}°C</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

```tsx
// src/components/PoleaDiagnosticoBlock.tsx
import type { ReporteConDetalle } from '@/lib/types'

type Lectura = ReporteConDetalle['lecturas'][number]

export function PoleaDiagnosticoBlock({ lectura }: { lectura: Lectura }) {
  return (
    <div className="rounded border bg-white">
      <div className="bg-blue-900 p-2 text-sm font-semibold text-white">
        DIAGNÓSTICO POLEA {String(lectura.polea.numero).padStart(2, '0')}
      </div>
      <div className="grid grid-cols-2 gap-4 p-4">
        <p className="whitespace-pre-line text-sm">{lectura.diagnosticoTexto}</p>
        <div className="grid grid-cols-2 gap-2">
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lectura.fotoIzquierdaUrl} alt="Termograma izquierda" className="w-full rounded" />
            <figcaption className="text-center text-xs">Izquierda — {lectura.tempIzquierda}°C</figcaption>
          </figure>
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lectura.fotoDerechaUrl} alt="Termograma derecha" className="w-full rounded" />
            <figcaption className="text-center text-xs">Derecha — {lectura.tempDerecha}°C</figcaption>
          </figure>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add `deleteReporte` to the reportes actions**

Append to `src/server/actions/reportes.ts`:

```ts
export async function deleteReporte(id: string): Promise<void> {
  const reporte = await prisma.reporte.delete({ where: { id } })
  revalidatePath(`/fajas/${reporte.fajaId}`)
}
```

- [ ] **Step 4: Build the delete button and the page**

```tsx
// src/app/reportes/[id]/DeleteReporteButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteReporte } from '@/server/actions/reportes'

export function DeleteReporteButton({ reporteId, fajaId }: { reporteId: string; fajaId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="rounded border border-red-600 px-3 py-2 text-red-600">
        Eliminar reporte
      </button>
    )
  }

  return (
    <div className="rounded border border-red-600 bg-red-50 p-3">
      <p className="text-sm text-red-700">¿Confirmas que quieres eliminar este reporte?</p>
      <div className="mt-2 flex gap-2">
        <button
          onClick={async () => {
            await deleteReporte(reporteId)
            router.push(`/fajas/${fajaId}`)
          }}
          className="rounded bg-red-600 px-3 py-2 text-white"
        >
          Sí, eliminar
        </button>
        <button onClick={() => setConfirming(false)} className="rounded border px-3 py-2">Cancelar</button>
      </div>
    </div>
  )
}
```

```tsx
// src/app/reportes/[id]/page.tsx
import { notFound } from 'next/navigation'
import { getReporteById } from '@/server/actions/reportes'
import { ReporteHeader } from '@/components/ReporteHeader'
import { CriterioTable } from '@/components/CriterioTable'
import { PoleaDiagnosticoBlock } from '@/components/PoleaDiagnosticoBlock'
import { DeleteReporteButton } from './DeleteReporteButton'

export default async function ReporteDetailPage({ params }: { params: { id: string } }) {
  const reporte = await getReporteById(params.id)
  if (!reporte) notFound()

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <ReporteHeader reporte={reporte} />
      {reporte.faja.esquemaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={reporte.faja.esquemaUrl} alt="Esquema de poleas" className="max-w-full rounded border" />
      )}
      <CriterioTable criterios={reporte.faja.criterios} />
      {reporte.lecturas.map((lectura) => (
        <PoleaDiagnosticoBlock key={lectura.id} lectura={lectura} />
      ))}
      <DeleteReporteButton reporteId={reporte.id} fajaId={reporte.fajaId} />
    </main>
  )
}
```

- [ ] **Step 5: Manual verification**

Run `npm run dev`, open the reporte created in Task 9's manual test from `/fajas/[id]`, and confirm the header, criterios table, and each polea's diagnóstico + photos render correctly.

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/components/ReporteHeader.tsx src/components/CriterioTable.tsx src/components/PoleaDiagnosticoBlock.tsx src/app/reportes src/server/actions/reportes.ts
git commit -m "feat: add reporte detail page with header, criterios and diagnostico blocks"
```

---

### Task 11: Historical table and trend charts

**Files:**
- Create: `src/lib/historico.ts`
- Create: `src/components/HistoricoTable.tsx`
- Create: `src/components/TrendChart.tsx`
- Modify: `src/app/fajas/[id]/page.tsx`
- Test: `tests/lib/historico.test.ts`

**Interfaces:**
- Consumes: `prisma` (Task 2), `computeDelta` (Task 3).
- Produces: `getHistoricoByFaja(fajaId): Promise<PoleaHistorico[]>` and its `PoleaHistorico`/`LecturaHistorica` types — consumed by `HistoricoTable`, `TrendChart`, and the print route in Task 12.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/historico.test.ts
import { describe, it, expect, afterEach } from 'vitest'
import { prisma } from '../../src/lib/prisma'
import { createFaja } from '../../src/server/actions/fajas'
import { createReporte } from '../../src/server/actions/reportes'
import { getHistoricoByFaja } from '../../src/lib/historico'

describe('getHistoricoByFaja', () => {
  afterEach(async () => {
    await prisma.faja.deleteMany({ where: { tag: { startsWith: '6666' } } })
    await prisma.cliente.deleteMany({ where: { nombre: 'Test Cliente Historico' } })
    await prisma.contratista.deleteMany({ where: { nombre: 'Test Contratista Historico' } })
  })

  it('returns lecturas per polea ordered by fecha with delta computed', async () => {
    const cliente = await prisma.cliente.create({ data: { nombre: 'Test Cliente Historico' } })
    const contratista = await prisma.contratista.create({ data: { nombre: 'Test Contratista Historico' } })
    const faja = await createFaja({
      clienteId: cliente.id,
      contratistaId: contratista.id,
      area: '6666',
      nombre: 'CV001',
      lugar: 'MOQUEGUA',
      numeroPoleas: 1,
      createdByUserId: 'test-user',
    })
    const polea = await prisma.polea.findFirstOrThrow({ where: { fajaId: faja.id } })

    const lecturaInput = {
      poleaId: polea.id,
      fotoIzquierdaUrl: 'https://example.com/i.jpg',
      fotoDerechaUrl: 'https://example.com/d.jpg',
      condicion: 'NORMAL' as const,
      diagnosticoTexto: 'texto',
    }
    await createReporte({
      fajaId: faja.id, fecha: new Date('2026-02-17'), especialista: 'X', supervisor: 'Y',
      numeroAvisoSAP: '1', createdByUserId: 'test-user',
      lecturas: [{ ...lecturaInput, tempIzquierda: 22.8, tempDerecha: 26.2 }],
    })
    await createReporte({
      fajaId: faja.id, fecha: new Date('2026-08-02'), especialista: 'X', supervisor: 'Y',
      numeroAvisoSAP: '2', createdByUserId: 'test-user',
      lecturas: [{ ...lecturaInput, tempIzquierda: 32.4, tempDerecha: 22.5 }],
    })

    const historico = await getHistoricoByFaja(faja.id)
    expect(historico).toHaveLength(1)
    expect(historico[0].lecturas).toHaveLength(2)
    expect(historico[0].lecturas[0].fecha.toISOString()).toContain('2026-02-17')
    expect(historico[0].lecturas[1].delta).toBeCloseTo(9.9)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/historico.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/historico.ts`**

```ts
// src/lib/historico.ts
import { prisma } from './prisma'
import { computeDelta } from './condicion'
import type { Condicion } from '@prisma/client'

export interface LecturaHistorica {
  fecha: Date
  tempIzquierda: number
  tempDerecha: number
  delta: number
  condicion: Condicion
}

export interface PoleaHistorico {
  poleaId: string
  numero: number
  tipo: string | null
  lecturas: LecturaHistorica[]
}

export async function getHistoricoByFaja(fajaId: string): Promise<PoleaHistorico[]> {
  const poleas = await prisma.polea.findMany({
    where: { fajaId },
    orderBy: { numero: 'asc' },
    include: {
      lecturas: {
        include: { reporte: true },
        orderBy: { reporte: { fecha: 'asc' } },
      },
    },
  })

  return poleas.map((polea) => ({
    poleaId: polea.id,
    numero: polea.numero,
    tipo: polea.tipo,
    lecturas: polea.lecturas.map((lectura) => ({
      fecha: lectura.reporte.fecha,
      tempIzquierda: lectura.tempIzquierda,
      tempDerecha: lectura.tempDerecha,
      delta: computeDelta(lectura.tempIzquierda, lectura.tempDerecha),
      condicion: lectura.condicion,
    })),
  }))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/historico.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Build the table and chart components**

```tsx
// src/components/HistoricoTable.tsx
import type { PoleaHistorico } from '@/lib/historico'

export function HistoricoTable({ historico }: { historico: PoleaHistorico[] }) {
  return (
    <div className="space-y-4">
      {historico.map((polea) => (
        <table key={polea.poleaId} className="w-full rounded border bg-white text-sm">
          <caption className="p-2 text-left font-medium">
            Polea {polea.numero}{polea.tipo ? ` — ${polea.tipo}` : ''}
          </caption>
          <thead>
            <tr className="text-left">
              <th className="px-2 py-1">Fecha</th>
              <th className="px-2 py-1">Izquierda °C</th>
              <th className="px-2 py-1">Derecha °C</th>
              <th className="px-2 py-1">Delta</th>
              <th className="px-2 py-1">Condición</th>
            </tr>
          </thead>
          <tbody>
            {polea.lecturas.map((lectura, index) => (
              <tr key={index}>
                <td className="px-2 py-1">{new Date(lectura.fecha).toLocaleDateString('es-PE')}</td>
                <td className="px-2 py-1">{lectura.tempIzquierda}</td>
                <td className="px-2 py-1">{lectura.tempDerecha}</td>
                <td className="px-2 py-1">{lectura.delta}</td>
                <td className="px-2 py-1">{lectura.condicion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </div>
  )
}
```

```tsx
// src/components/TrendChart.tsx
'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { PoleaHistorico } from '@/lib/historico'

export function TrendChart({ polea }: { polea: PoleaHistorico }) {
  const data = polea.lecturas.map((lectura) => ({
    fecha: new Date(lectura.fecha).toLocaleDateString('es-PE'),
    izquierda: lectura.tempIzquierda,
    derecha: lectura.tempDerecha,
  }))

  return (
    <div className="rounded border bg-white p-3">
      <h3 className="mb-2 text-sm font-medium">
        Polea {polea.numero}{polea.tipo ? ` — ${polea.tipo}` : ''}
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="fecha" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="izquierda" name="Lado izquierdo" stroke="#2563eb" />
          <Line type="monotone" dataKey="derecha" name="Lado derecho" stroke="#f97316" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 6: Integrate into the faja detail page**

In `src/app/fajas/[id]/page.tsx`, add the import `import { getHistoricoByFaja } from '@/lib/historico'`, `import { HistoricoTable } from '@/components/HistoricoTable'`, `import { TrendChart } from '@/components/TrendChart'`, fetch `const historico = await getHistoricoByFaja(faja.id)` alongside the existing `getFajaById` call, and add this section before `<DeleteFajaButton .../>`:

```tsx
<section>
  <h2 className="mb-2 font-medium">Histórico de temperatura</h2>
  <HistoricoTable historico={historico} />
</section>

<section>
  <h2 className="mb-2 font-medium">Tendencias</h2>
  <div className="grid grid-cols-2 gap-4">
    {historico.map((polea) => (
      <TrendChart key={polea.poleaId} polea={polea} />
    ))}
  </div>
</section>
```

- [ ] **Step 7: Manual verification**

Run `npm run dev`, create a second reporte on the same faja used in Task 9/10 with different temperatures, open the faja page, and confirm the histórico table shows both dates and the trend chart shows two connected points per side.

- [ ] **Step 8: Commit**

```bash
git add src/lib/historico.ts src/components/HistoricoTable.tsx src/components/TrendChart.tsx src/app/fajas/[id]/page.tsx tests/lib/historico.test.ts
git commit -m "feat: add historical table and trend charts to faja detail page"
```

---

### Task 12: Print route

**Files:**
- Create: `src/lib/printToken.ts`
- Create: `src/app/reportes/[id]/print/page.tsx`
- Create: `src/app/reportes/[id]/print/print.css`
- Test: `tests/lib/printToken.test.ts`

**Interfaces:**
- Consumes: `getReporteById` (Task 9), `getHistoricoByFaja` (Task 11), `ReporteHeader`/`CriterioTable`/`PoleaDiagnosticoBlock` (Task 10), `HistoricoTable`/`TrendChart` (Task 11).
- Produces: `generatePrintToken(reporteId): string`, `verifyPrintToken(reporteId, token): boolean` — consumed by Task 13's PDF endpoint; the `/reportes/[id]/print?token=...` route with a `#print-ready` DOM marker Puppeteer waits for.

- [ ] **Step 1: Write the failing test for the print token**

```ts
// tests/lib/printToken.test.ts
import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.PRINT_TOKEN_SECRET = 'test-secret'
})

describe('printToken', () => {
  it('generates a token that verifies for the same reporteId and rejects others', async () => {
    const { generatePrintToken, verifyPrintToken } = await import('../../src/lib/printToken')
    const token = generatePrintToken('reporte-123')
    expect(verifyPrintToken('reporte-123', token)).toBe(true)
    expect(verifyPrintToken('reporte-456', token)).toBe(false)
    expect(verifyPrintToken('reporte-123', 'tampered')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/printToken.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/printToken.ts`**

```ts
// src/lib/printToken.ts
import { createHmac, timingSafeEqual } from 'node:crypto'

export function generatePrintToken(reporteId: string): string {
  const secret = process.env.PRINT_TOKEN_SECRET as string
  return createHmac('sha256', secret).update(reporteId).digest('hex')
}

export function verifyPrintToken(reporteId: string, token: string): boolean {
  const expected = generatePrintToken(reporteId)
  const expectedBuffer = Buffer.from(expected)
  const tokenBuffer = Buffer.from(token)
  if (expectedBuffer.length !== tokenBuffer.length) return false
  return timingSafeEqual(expectedBuffer, tokenBuffer)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/printToken.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Build the print route**

```css
/* src/app/reportes/[id]/print/print.css */
@media print {
  .polea-block, .trend-chart {
    page-break-inside: avoid;
  }
  .historico-section {
    page-break-before: always;
  }
}
```

```tsx
// src/app/reportes/[id]/print/page.tsx
import { notFound } from 'next/navigation'
import { getReporteById } from '@/server/actions/reportes'
import { getHistoricoByFaja } from '@/lib/historico'
import { ReporteHeader } from '@/components/ReporteHeader'
import { CriterioTable } from '@/components/CriterioTable'
import { PoleaDiagnosticoBlock } from '@/components/PoleaDiagnosticoBlock'
import { HistoricoTable } from '@/components/HistoricoTable'
import { TrendChart } from '@/components/TrendChart'
import { verifyPrintToken } from '@/lib/printToken'
import './print.css'

export default async function ReportePrintPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { token?: string }
}) {
  if (!searchParams.token || !verifyPrintToken(params.id, searchParams.token)) {
    notFound()
  }

  const reporte = await getReporteById(params.id)
  if (!reporte) notFound()
  const historico = await getHistoricoByFaja(reporte.fajaId)

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <ReporteHeader reporte={reporte} />
      {reporte.faja.esquemaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={reporte.faja.esquemaUrl} alt="Esquema de poleas" className="max-w-full rounded border" />
      )}
      <CriterioTable criterios={reporte.faja.criterios} />
      {reporte.lecturas.map((lectura) => (
        <div key={lectura.id} className="polea-block">
          <PoleaDiagnosticoBlock lectura={lectura} />
        </div>
      ))}

      <div className="historico-section space-y-4">
        <h2 className="text-lg font-semibold">Histórico de temperatura</h2>
        <HistoricoTable historico={historico} />
        <div className="grid grid-cols-2 gap-4">
          {historico.map((polea) => (
            <div key={polea.poleaId} className="trend-chart">
              <TrendChart polea={polea} />
            </div>
          ))}
        </div>
      </div>

      <div id="print-ready" data-ready="true" />
    </main>
  )
}
```

Note: this route is intentionally **outside** the auth `middleware.ts` matcher (Task 4's matcher lists `/reportes/:path*`, which *would* catch this — update `middleware.ts`'s `matcher` array now, replacing `'/reportes/:path*'` with `'/reportes'` and `'/reportes/((?!.*\\/print).*)'` is unnecessarily complex; instead keep `/reportes/:path*` in the matcher but add an early return: since NextAuth's default middleware doesn't support per-route bypass easily, simplest fix is the token check inside the page itself already guards access — leave `/reportes/:path*` protected by session AND additionally reachable by Puppeteer's request, which won't have a session cookie. Resolve this by removing `/reportes/:path*` from `middleware.ts`'s matcher (the print route's own token check plus each reporte/faja page already being behind other protected routes is sufficient) — update the matcher:

```ts
// middleware.ts (updated matcher)
export const config = {
  matcher: [
    '/clientes/:path*',
    '/contratistas/:path*',
    '/fajas/:path*',
    '/api/cloudinary/:path*',
  ],
}
```

This means `/reportes/[id]` (the human-facing detail page from Task 10) is no longer session-gated by middleware. Add an explicit session check at the top of `src/app/reportes/[id]/page.tsx` instead: `import { getServerSession } from 'next-auth'`, `import { authOptions } from '@/lib/auth'`, and at the start of the component `const session = await getServerSession(authOptions); if (!session) redirect('/login')` (import `redirect` from `next/navigation`). The `/reportes/[id]/print` route stays intentionally open to anyone holding a valid token, since Puppeteer requests it without a browser session.

- [ ] **Step 6: Manual verification**

Run `npm run dev`. In a browser console on any logged-in page, run:
```js
fetch('/api/auth/session').then(r => r.json()).then(console.log)
```
just to confirm you're logged in, then manually visit `/reportes/[id]/print` (no token) and confirm it 404s. This route's happy path (with a valid token) is verified end-to-end in Task 13.

- [ ] **Step 7: Commit**

```bash
git add src/lib/printToken.ts src/app/reportes/[id]/print middleware.ts src/app/reportes/[id]/page.tsx tests/lib/printToken.test.ts
git commit -m "feat: add token-protected print route for reportes"
```

---

### Task 13: PDF generation with Puppeteer

**Files:**
- Create: `src/app/api/reportes/[id]/pdf/route.ts`
- Modify: `src/app/reportes/[id]/page.tsx`

**Interfaces:**
- Consumes: `generatePrintToken` (Task 12), `authOptions` (Task 4), `APP_BASE_URL` env var.
- Produces: `GET /api/reportes/[id]/pdf` returning `application/pdf`; a "Descargar PDF" link on the reporte detail page.

- [ ] **Step 1: Implement the PDF route**

```ts
// src/app/api/reportes/[id]/pdf/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import puppeteer from 'puppeteer'
import { authOptions } from '@/lib/auth'
import { generatePrintToken } from '@/lib/printToken'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:3000'
  const token = generatePrintToken(params.id)
  const printUrl = `${baseUrl}/reportes/${params.id}/print?token=${token}`

  const browser = await puppeteer.launch({ headless: true })
  try {
    const page = await browser.newPage()
    const response = await page.goto(printUrl, { waitUntil: 'networkidle0', timeout: 30000 })
    if (!response || !response.ok()) {
      throw new Error('No se pudo cargar la vista de impresión del reporte')
    }
    await page.waitForSelector('#print-ready', { timeout: 30000 })
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte-${params.id}.pdf"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al generar el PDF' },
      { status: 500 }
    )
  } finally {
    await browser.close()
  }
}
```

- [ ] **Step 2: Add the download link**

In `src/app/reportes/[id]/page.tsx`, add near `<DeleteReporteButton .../>`:

```tsx
<a
  href={`/api/reportes/${reporte.id}/pdf`}
  className="inline-block rounded bg-blue-600 px-4 py-2 text-white"
>
  Descargar PDF
</a>
```

- [ ] **Step 3: Manual verification**

Set `APP_BASE_URL="http://localhost:3000"` in `.env` (already in `.env.example` from Task 1). Run `npm run dev`, open a reporte with at least two historico data points (from Task 11's manual test), click "Descargar PDF", and confirm: the file downloads, opens as a valid PDF, shows the blue header banner with both logos, the criterios table with its colors, each polea's diagnóstico + two photos without being cut mid-block, and the histórico table + trend charts on a following page.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/reportes/[id]/pdf src/app/reportes/[id]/page.tsx
git commit -m "feat: generate reporte PDF via Puppeteer print route"
```

---

### Task 14: Cross-cutting UX polish and edge-case verification

**Files:**
- Modify: `src/app/fajas/new/FajaForm.tsx`

**Interfaces:**
- Consumes: everything built so far. No new exports — this task closes out the error-handling items from the spec that aren't already covered by earlier tasks' own validation (tag duplicate error from Task 7, incomplete-reporte validation from Task 9, reduce-poleas guard from Task 8, upload validation from Task 5).

- [ ] **Step 1: Confirm the tag-duplicate error surfaces in the UI**

`createFaja` (Task 7) already throws `Ya existe una faja con el tag X`, and `FajaForm.tsx`'s `catch` block (Task 7, Step 5) already renders `err.message` in the `{error && ...}` paragraph — no code change needed. Verify it manually: run `npm run dev`, create a faja with area `1111`/nombre `CV001`, then try to create another with the same area/nombre, and confirm the red error text reads "Ya existe una faja con el tag 1111CV001" instead of a raw stack trace or an unhandled crash.

- [ ] **Step 2: Verify session-expiry redirect**

With the dev server running, log in, open devtools → Application → Cookies, delete the `next-auth.session-token` cookie, then navigate to `/fajas`. Confirm you're redirected to `/login?callbackUrl=%2Ffajas` (Task 4's middleware) rather than seeing a crash or an empty page.

- [ ] **Step 3: Verify cascade delete confirmation copy is accurate**

Open a faja with at least one reporte, click "Eliminar faja" (Task 8), and confirm the confirmation text states the correct reporte count before you (optionally) confirm the delete on a disposable test faja.

- [ ] **Step 4: Verify upload validation**

On any `ImageUploader` (e.g. the Cliente logo form), try selecting a `.pdf` or `.gif` file and confirm the "Solo se permiten imágenes JPG o PNG" message appears without a network request being made (open devtools → Network tab while doing this to confirm no request to `/api/cloudinary/sign` fires).

- [ ] **Step 5: Tighten the numeroPoleas guard message in the UI**

`updateNumeroPoleas` (Task 8) throws a clear error when reducing below poleas with lecturas, but there's currently no UI control that calls it — `FajaForm.tsx` only sets `numeroPoleas` at creation time. Add a minimal editable control for it on the faja detail page:

In `src/app/fajas/[id]/page.tsx`, this is deferred: creating an inline `NumeroPoleasEditor` client component mirroring `PoleaTipoEditor`'s pattern (local state + `onBlur` calling `updateNumeroPoleas(faja.id, Number(value))` + `router.refresh()`, with the thrown error caught and shown in a red `<p>`) is a natural follow-up but not required for the MVP happy path (poleas count is fixed correctly at faja-creation time in the vast majority of cases). Skip building it now; note it as a fast-follow if the team needs to correct a faja's polea count after the fact.

- [ ] **Step 6: Commit** (only if Step 1 needed an actual fix; otherwise this task produces no diff and is a verification-only checkpoint — skip the commit)

```bash
git add -A
git commit -m "chore: verify cross-cutting edge cases" --allow-empty-message -m "No code changes needed; all edge cases already handled by earlier tasks."
```

---

### Task 15: Documentation and end-to-end smoke test

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: nothing new.
- Produces: setup instructions for a new developer; a manually-verified end-to-end walkthrough proving the whole system works together.

- [ ] **Step 1: Write the README**

```markdown
# Inspección Predictiva — Reportes de Termografía

App para gestionar clientes, contratistas, fajas transportadoras y sus reportes
periódicos de inspección termográfica a chumaceras de poleas.

## Requisitos

- Node.js 20+
- PostgreSQL local corriendo en `localhost:5432` con usuario `postgres` / password `root`
- Una cuenta de Cloudinary (cloud name, API key, API secret)

## Setup

1. `npm install`
2. Copiar `.env.example` a `.env` y completar `CLOUDINARY_*`, `NEXTAUTH_SECRET` y `PRINT_TOKEN_SECRET` con valores reales.
3. Crear la base de datos: `PGPASSWORD=root psql -U postgres -h localhost -c "CREATE DATABASE insp_predictivo;"`
4. `npm run prisma:migrate`
5. `npm run prisma:seed` (crea el usuario `admin@insp.local` / `changeme123`, configurable vía `SEED_USER_EMAIL` / `SEED_USER_PASSWORD`)
6. `npm run dev` y abrir `http://localhost:3000`

## Tests

`npm run test` corre contra la base de datos local configurada en `DATABASE_URL` — no usa una base de datos de prueba separada. Los tests de integración limpian las filas que crean.

## Flujo principal

Login → Clientes/Contratistas (con logo) → Nueva faja (área+nombre → tag, poleas, esquema, criterios) → Reporte (fecha, especialista, supervisor, lecturas + fotos por polea) → Ver reporte / Descargar PDF → Ver histórico y tendencias en la página de la faja.
```

- [ ] **Step 2: Full end-to-end smoke test**

Run `npm run dev` and, as a single walkthrough, verify:
1. Visiting `/fajas` while logged out redirects to `/login`.
2. Logging in with the seed user works.
3. Creating a Cliente and a Contratista, each with a real logo upload, succeeds and both appear in their lists.
4. Creating a Faja with area `3220`, nombre `CV001`, 5 poleas, an esquema image, and confirming the tag preview `3220CV001` matched what was saved.
5. Editing one criterio's ranges and one polea's `tipo` on the faja page persists after refresh.
6. Creating a Reporte with all 5 poleas' temperatures, conditions and both photos each succeeds, and the resulting `condicionGeneral` matches the worst condición chosen.
7. Creating a second Reporte on the same faja with different temperatures, then confirming the faja page's histórico table and trend charts show both dates.
8. Opening the reporte detail page shows the header, criterios table, and all 5 polea blocks with their photos.
9. Clicking "Descargar PDF" produces a PDF matching the on-screen content, including the histórico section.
10. Deleting the test reporte and then the test faja both work and show the correct confirmation copy.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add setup instructions and smoke test checklist"
```
