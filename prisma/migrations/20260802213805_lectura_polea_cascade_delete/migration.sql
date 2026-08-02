-- DropForeignKey
ALTER TABLE "LecturaPolea" DROP CONSTRAINT "LecturaPolea_poleaId_fkey";

-- AddForeignKey
ALTER TABLE "LecturaPolea" ADD CONSTRAINT "LecturaPolea_poleaId_fkey" FOREIGN KEY ("poleaId") REFERENCES "Polea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
