-- CreateEnum
CREATE TYPE "Condicion" AS ENUM ('NORMAL', 'TOLERABLE', 'PRECAUCION', 'CRITICO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "logoUrl" TEXT,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contratista" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "logoUrl" TEXT,

    CONSTRAINT "Contratista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faja" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "contratistaId" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "lugar" TEXT NOT NULL,
    "descripcion" TEXT,
    "numeroPoleas" INTEGER NOT NULL,
    "esquemaUrl" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Faja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriterioAceptacion" (
    "id" TEXT NOT NULL,
    "fajaId" TEXT NOT NULL,
    "nivel" "Condicion" NOT NULL,
    "tempMin" DOUBLE PRECISION NOT NULL,
    "tempMax" DOUBLE PRECISION NOT NULL,
    "deltaMin" DOUBLE PRECISION NOT NULL,
    "deltaMax" DOUBLE PRECISION NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "CriterioAceptacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Polea" (
    "id" TEXT NOT NULL,
    "fajaId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "tipo" TEXT,

    CONSTRAINT "Polea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reporte" (
    "id" TEXT NOT NULL,
    "fajaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "especialista" TEXT NOT NULL,
    "supervisor" TEXT NOT NULL,
    "numeroAvisoSAP" TEXT NOT NULL,
    "condicionGeneral" "Condicion" NOT NULL,
    "observacionGeneral" TEXT NOT NULL DEFAULT 'Equipo sin indicaciones',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LecturaPolea" (
    "id" TEXT NOT NULL,
    "reporteId" TEXT NOT NULL,
    "poleaId" TEXT NOT NULL,
    "tempIzquierda" DOUBLE PRECISION NOT NULL,
    "tempDerecha" DOUBLE PRECISION NOT NULL,
    "fotoIzquierdaUrl" TEXT NOT NULL,
    "fotoDerechaUrl" TEXT NOT NULL,
    "condicion" "Condicion" NOT NULL,
    "diagnosticoTexto" TEXT NOT NULL,

    CONSTRAINT "LecturaPolea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Faja_tag_key" ON "Faja"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "CriterioAceptacion_fajaId_nivel_key" ON "CriterioAceptacion"("fajaId", "nivel");

-- CreateIndex
CREATE UNIQUE INDEX "Polea_fajaId_numero_key" ON "Polea"("fajaId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "LecturaPolea_reporteId_poleaId_key" ON "LecturaPolea"("reporteId", "poleaId");

-- AddForeignKey
ALTER TABLE "Faja" ADD CONSTRAINT "Faja_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faja" ADD CONSTRAINT "Faja_contratistaId_fkey" FOREIGN KEY ("contratistaId") REFERENCES "Contratista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterioAceptacion" ADD CONSTRAINT "CriterioAceptacion_fajaId_fkey" FOREIGN KEY ("fajaId") REFERENCES "Faja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Polea" ADD CONSTRAINT "Polea_fajaId_fkey" FOREIGN KEY ("fajaId") REFERENCES "Faja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reporte" ADD CONSTRAINT "Reporte_fajaId_fkey" FOREIGN KEY ("fajaId") REFERENCES "Faja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LecturaPolea" ADD CONSTRAINT "LecturaPolea_reporteId_fkey" FOREIGN KEY ("reporteId") REFERENCES "Reporte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LecturaPolea" ADD CONSTRAINT "LecturaPolea_poleaId_fkey" FOREIGN KEY ("poleaId") REFERENCES "Polea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
