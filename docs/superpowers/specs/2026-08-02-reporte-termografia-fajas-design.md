# Diseño: App de reportes de termografía para chumaceras de poleas

Fecha: 2026-08-02

## Contexto y objetivo

Actualmente los reportes de inspección termográfica a chumaceras de poleas de fajas transportadoras se hacen manualmente en Excel/PDF (ver `20260802-3220CV001-CHUMACERAS-IRVT-OT 4016597449.pdf` y `20260802-3220CV003-CHUMACERAS-IRVT-OT 4016597449.pdf` en la raíz del proyecto, usados como referencia del formato objetivo).

Se construirá una aplicación web donde un especialista pueda:
1. Configurar Clientes y Contratistas (nombre + logo).
2. Crear una Faja transportadora (área, nombre → tag, lugar, número de poleas, esquema de ubicación de poleas, criterios de aceptación).
3. Crear Reportes periódicos sobre una Faja: fecha, especialista, supervisor, y por cada polea, temperaturas, fotos de termogramas (izquierda/derecha) y condición.
4. Ver el reporte en el frontend y descargarlo en PDF con un layout fiel al formato original.
5. Ver el histórico de temperaturas por chumacera a lo largo de los reportes de una faja, con tablas y gráficos de tendencia.

## Alcance del MVP

Incluye: gestión de Cliente/Contratista, gestión de Faja (con esquema y criterios), gestión de Poleas, creación de Reportes con fotos, vista de reporte, histórico y gráficos de tendencia por faja, exportación a PDF, login simple de un solo rol.

Fuera de alcance (explícitamente descartado en el diseño): roles diferenciados, importación de datos históricos previos a la app (el histórico arranca vacío por faja), estado de "borrador" para reportes incompletos, tests E2E automatizados con navegador.

## Arquitectura

- **Next.js (App Router, TypeScript)** para frontend y backend (Server Actions / API routes) en un solo proyecto.
- **Prisma** sobre **PostgreSQL local** (usuario `postgres`, password `root`).
- **Auth.js (NextAuth) con Credentials provider** — login email/password (bcrypt), sesión JWT, un solo rol. Usuarios se crean por seed inicial (sin registro público en el MVP).
- **Cloudinary** para logos, esquemas de faja y fotos de termogramas — subida directa desde el navegador con firma generada en un endpoint server-side (no pasa por el backend de la app).
- **Tailwind CSS** para estilos, reutilizados tanto en la vista web del reporte como en la plantilla usada para generar el PDF.
- **Recharts** para los gráficos de tendencia de temperatura por chumacera.
- **Puppeteer** para generar el PDF: renderiza server-side una ruta de impresión (misma UI del reporte) a PDF.

## Modelo de datos

```
User
  id, name, email, passwordHash, createdAt

Cliente
  id, nombre, logoUrl

Contratista
  id, nombre, logoUrl

Faja
  id, clienteId, contratistaId
  area          (ej. "3220")
  nombre        (ej. "CV001")
  tag           (derivado: area+nombre → "3220CV001", único)
  lugar         (ej. "MOQUEGUA")
  descripcion   (ej. "FAJA TRANSPORTADORA PEBBLES", opcional)
  numeroPoleas
  esquemaUrl    (imagen del esquema de ubicación de poleas)
  createdByUserId, createdAt

CriterioAceptacion   (4 filas por Faja)
  id, fajaId
  nivel        (NORMAL | TOLERABLE | PRECAUCION | CRITICO)
  tempMin, tempMax     (rango °C)
  deltaMin, deltaMax   (rango delta °C)
  color

Polea
  id, fajaId
  numero       (1..N)
  tipo         (texto libre opcional: "Motriz", "Cabeza", "Deflectora", "Tensora", "Cola")

Reporte
  id, fajaId
  fecha
  especialista, supervisor
  numeroAvisoSAP
  condicionGeneral   (derivada: peor condición entre sus LecturaPolea)
  observacionGeneral (default "Equipo sin indicaciones", editable)
  createdByUserId, createdAt

LecturaPolea   (1 por Polea x Reporte)
  id, reporteId, poleaId
  tempIzquierda, tempDerecha
  fotoIzquierdaUrl, fotoDerechaUrl
  condicion       (NORMAL | TOLERABLE | PRECAUCION | CRITICO — elegida manualmente por el especialista)
  diagnosticoTexto (autogenerado desde plantilla, editable)
```

Notas:
- El `tag` se calcula y guarda al crear la faja (no se recalcula en cada uso).
- Las chumaceras (izquierda/derecha) no son una entidad propia: son campos de `LecturaPolea`, porque no tienen datos fuera de sus lecturas.
- El `delta` (`|tempIzquierda - tempDerecha|`) se calcula al vuelo, no se persiste.
- `condicionGeneral` del Reporte se deriva automáticamente; no se pide al usuario que la seleccione aparte.
- El histórico/gráficos de una Faja se arman consultando todas las `LecturaPolea` de una misma `Polea` ordenadas por `Reporte.fecha` — sin tablas adicionales.

## Flujos de usuario

**Login** — Email/password vía Auth.js. Sin registro público en el MVP.

**Gestión de Cliente / Contratista** — CRUD simple: nombre + logo (Cloudinary). Se reutilizan al crear Fajas.

**Crear Faja**:
1. Seleccionar/crear Cliente y Contratista.
2. Área, Nombre, Lugar, Descripción → tag calculado en vivo.
3. Número de poleas → genera automáticamente esa cantidad de `Polea` (numeradas), editables después para asignar `tipo`.
4. Subir esquema de ubicación de poleas.
5. Definir los 4 niveles de criterio de aceptación (nombres/colores predefinidos NORMAL/TOLERABLE/PRECAUCIÓN/CRÍTICO, rangos numéricos editables).

**Crear Reporte** (sobre una Faja existente):
1. Fecha, Especialista, Supervisor, Nº de Aviso SAP.
2. Por cada Polea: temperatura izquierda, temperatura derecha, condición (dropdown, con tabla de criterios como referencia visual), foto izquierda y foto derecha (subida directa a Cloudinary con preview). Diagnóstico autogenerado desde plantilla, editable.
3. Observación general editable.
4. Al guardar: se calcula `condicionGeneral`.

Validación: fecha, especialista, supervisor y, por cada polea, ambas temperaturas y ambas fotos son obligatorias antes de guardar (sin estado "borrador").

**Ver Faja** — Datos generales, esquema, criterios, lista de Reportes, y sección de histórico: tabla por chumacera con todas las fechas + gráfico de línea (izquierda vs derecha) por Polea.

**Ver Reporte / Exportar PDF** — Vista de detalle (header con logos, condición, diagnóstico + fotos por polea) con botón de descarga en PDF.

## Generación de PDF y gráficos

- Ruta de impresión `/reportes/[id]/print`: página Next.js sin navegación, con dos secciones:
  1. Header (logos, tag, área, lugar, fecha, especialista, supervisor, condición general), esquema de poleas, tabla de criterios, y un bloque por Polea con diagnóstico + 2 fotos.
  2. Histórico: tabla de temperaturas por chumacera y fecha (delta, condición) + gráfico de línea (Recharts) por Polea.
- CSS de impresión con `page-break-inside: avoid` por bloque de Polea/gráfico y `page-break-before` entre secciones.
- Endpoint `/api/reportes/[id]/pdf`: lanza Puppeteer, navega a la ruta de impresión (autenticada con token interno), espera carga de imágenes y renderizado de gráficos SVG, genera PDF A4 con `printBackground: true`, lo devuelve como descarga. Timeout ~30s con mensaje de error y reintento si falla.
- No se almacenan los PDFs generados; se generan al vuelo en cada descarga para evitar versiones desactualizadas.
- Los gráficos Recharts se renderizan como SVG normal en el navegador headless — Puppeteer los captura tal cual, sin conversión a imagen aparte.

## Manejo de errores y edge cases

- **Tag duplicado**: `tag` único en BD; error claro en el formulario si área+nombre ya existe.
- **Reducir número de poleas**: se permite aumentar; no se permite bajar por debajo del número de poleas con lecturas existentes en algún reporte.
- **Reporte incompleto**: no se puede guardar sin fecha, especialista, supervisor, y ambas temperaturas+fotos por polea.
- **Subida de fotos/logos**: valida tipo (jpg/png) y tamaño máximo (~10MB); error puntual por archivo sin perder el resto del formulario.
- **Borrado de Faja/Reporte**: cascada en BD (Poleas, Criterios, Reportes) con confirmación explícita mostrando cuántos reportes se perderían. Las imágenes en Cloudinary no se borran automáticamente.
- **Generación de PDF**: timeout ~30s, mensaje de error y opción de reintentar.
- **Sesión expirada**: middleware de Auth.js redirige a login conservando la URL de destino.
- **Poca data histórica**: con 1 solo reporte, tabla y gráfico igual se muestran (un solo punto).

## Testing

- **Unit tests (Vitest)**: cálculo de `tag`, cálculo de `delta`, derivación de `condicionGeneral`, plantilla de texto de diagnóstico.
- **Tests de integración ligeros** sobre Server Actions/API routes críticos (crear faja con poleas y criterios, crear reporte con lecturas) contra BD de prueba.
- **Verificación manual** de subida a Cloudinary y de la salida visual del PDF (layout, colores, gráficos) como parte de la verificación antes de dar cada fase por completada.
- Sin tests E2E automatizados con navegador en el MVP.
