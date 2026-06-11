-- CreateEnum
CREATE TYPE "ToothTreatmentStatus" AS ENUM ('planned', 'done');

-- CreateTable
CREATE TABLE "ToothTreatment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "toothFdi" TEXT NOT NULL,
    "catalogItemId" TEXT,
    "description" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "status" "ToothTreatmentStatus" NOT NULL DEFAULT 'planned',
    "quoteId" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToothTreatment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ToothTreatment_patientId_idx" ON "ToothTreatment"("patientId");

-- AddForeignKey
ALTER TABLE "ToothTreatment" ADD CONSTRAINT "ToothTreatment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToothTreatment" ADD CONSTRAINT "ToothTreatment_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToothTreatment" ADD CONSTRAINT "ToothTreatment_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
