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

`npm run test` corre contra la base de datos local configurada en `DATABASE_URL` — no usa una base de datos de prueba separada. Los tests de integración limpian las filas que crean. Los archivos de test corren secuencialmente (`fileParallelism: false` en `vitest.config.ts`) porque comparten esa misma base de datos.

## Generación de PDF

El botón "Descargar PDF" en la vista de un reporte llama a `/api/reportes/[id]/pdf`, que usa Puppeteer para renderizar `/reportes/[id]/print` (protegida por un token HMAC, no por sesión de usuario) y convertirla a PDF. Requiere que `APP_BASE_URL` en `.env` apunte a la URL donde corre la app (por defecto `http://localhost:3000`).

## Flujo principal

Login → Clientes/Contratistas (con logo) → Nueva faja (área+nombre → tag, poleas, esquema, criterios) → Reporte (fecha, especialista, supervisor, lecturas + fotos por polea) → Ver reporte / Descargar PDF → Ver histórico y tendencias en la página de la faja.
