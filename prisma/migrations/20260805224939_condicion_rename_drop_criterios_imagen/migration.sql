-- Rename the Condicion enum values to the terminology actually used on site
ALTER TYPE "Condicion" RENAME VALUE 'NORMAL' TO 'BUENO';
ALTER TYPE "Condicion" RENAME VALUE 'TOLERABLE' TO 'ACEPTABLE';
ALTER TYPE "Condicion" RENAME VALUE 'PRECAUCION' TO 'INSATISFACTORIO';
ALTER TYPE "Condicion" RENAME VALUE 'CRITICO' TO 'INACEPTABLE';

-- Acceptance-criteria reference photo is replaced by manual data entry at faja creation
ALTER TABLE "Faja" DROP COLUMN "criteriosImagenUrl";
