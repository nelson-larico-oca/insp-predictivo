# Inspección Predictiva — Reportes de Termografía

App para gestionar clientes, contratistas, fajas transportadoras y sus reportes
periódicos de inspección termográfica a chumaceras de poleas.

## Requisitos

- Node.js 20+
- Una base de datos Postgres. El proyecto usa [Neon](https://neon.tech) (serverless, con connection pooling) por defecto, pero cualquier Postgres sirve.
- Una cuenta de Cloudinary (cloud name, API key, API secret)

## Setup

1. `npm install`
2. Copiar `.env.example` a `.env`.
3. `DATABASE_URL` / `DIRECT_URL`: connection strings de tu base Postgres.
   - Con Neon: `DATABASE_URL` es la connection string *pooled* (host con sufijo `-pooler`), y `DIRECT_URL` es la misma pero sin `-pooler` en el host — Prisma la necesita para correr migraciones, que no funcionan bien a través del pooler.
   - Con Postgres local u otro proveedor sin pooler: usa la misma URL en ambas variables.
4. Completar `CLOUDINARY_*`, `NEXTAUTH_SECRET` y `PRINT_TOKEN_SECRET` con valores reales.
5. `npm run prisma:migrate` (aplica las migraciones existentes contra tu base).
6. Crear el primer usuario (queda como ADMIN), con cualquiera de estas dos opciones:
   - `npm run prisma:seed` — crea `admin@insp.local` / `changeme123` (configurable vía `SEED_USER_EMAIL` / `SEED_USER_PASSWORD`), o lo deja como está si ese email ya existe.
   - `scripts/create-admin.ts` vía variables de entorno, útil para crear o promover un admin en cualquier momento (incluida producción) sin dejar la contraseña en ningún archivo: `ADMIN_NAME=... ADMIN_EMAIL=... ADMIN_PASSWORD=... npx tsx scripts/create-admin.ts`
7. `npm run dev` y abrir `http://localhost:3000`

## Cuentas y roles

Cada usuario tiene un rol: `ADMIN` o `USER` (por defecto). Los `ADMIN` ven el enlace "Administración" en la barra de navegación y acceden a `/admin`, donde pueden crear, editar, resetear la contraseña y eliminar cuentas. La ruta está protegida en el middleware (`src/middleware.ts`) y cada server action de usuarios (`src/server/actions/users.ts`) vuelve a validar el rol server-side.

## Tests

`npm run test` corre contra la base de datos configurada en `DATABASE_URL` — no usa una base de datos de prueba separada. Los tests de integración limpian las filas que crean. Los archivos de test corren secuencialmente (`fileParallelism: false` en `vitest.config.ts`) porque comparten esa misma base de datos. Si `DATABASE_URL` apunta a Neon, el primer test puede tardar unos segundos en lo que la conexión "despierta"; por eso `testTimeout` está en 20s en vez del default de 5s.

## Generación de PDF

El botón "Descargar PDF" en la vista de un reporte llama a `/api/reportes/[id]/pdf`, que usa Puppeteer para renderizar `/reportes/[id]/print` (protegida por un token HMAC, no por sesión de usuario) y convertirla a PDF. Requiere que `APP_BASE_URL` en `.env` apunte a la URL donde corre la app (por defecto `http://localhost:3000`).

En local usa el paquete `puppeteer` completo (descarga su propio Chromium). En Vercel (detectado vía `process.env.VERCEL`) usa `puppeteer-core` + `@sparticuz/chromium`, un build de Chromium comprimido para runtimes serverless — ver `src/app/api/reportes/[id]/pdf/route.ts`. `next.config.mjs` marca ambos paquetes como externos y fuerza la inclusión del binario de Chromium en el tracing de la función (`outputFileTracingIncludes`), porque `@sparticuz/chromium` lo carga desde disco en vez de con `require()`.

## Deploy

Pensado para Vercel. Configura estas variables de entorno en el proyecto de Vercel (no basta con tenerlas solo en `.env` local):

- `DATABASE_URL`, `DIRECT_URL` (Neon)
- `NEXTAUTH_URL` (la URL pública de producción), `NEXTAUTH_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `PRINT_TOKEN_SECRET`
- `APP_BASE_URL` (la misma URL pública de producción, la usa la ruta de PDF para navegar a la vista de impresión)

La función de `/api/reportes/[id]/pdf` tiene `maxDuration = 60` — si el plan de Vercel no permite ese límite, ajústalo en `src/app/api/reportes/[id]/pdf/route.ts`.

## Flujo principal

Login → Clientes/Contratistas (con logo) → Nueva faja (área+nombre → tag, poleas, esquema, criterios) → Reporte (fecha, especialista, supervisor, lecturas + fotos por polea) → Ver reporte / Descargar PDF → Ver histórico y tendencias en la página de la faja.
