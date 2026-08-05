-- Role no longer has a single default: it must always be passed explicitly by createUser
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

-- Scope a User to the Contratista or Cliente they belong to (nullable: only ADMIN has neither)
ALTER TABLE "User" ADD COLUMN "contratistaId" TEXT;
ALTER TABLE "User" ADD COLUMN "clienteId" TEXT;

ALTER TABLE "User" ADD CONSTRAINT "User_contratistaId_fkey"
  FOREIGN KEY ("contratistaId") REFERENCES "Contratista"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_clienteId_fkey"
  FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "User_contratistaId_idx" ON "User"("contratistaId");
CREATE INDEX "User_clienteId_idx" ON "User"("clienteId");
