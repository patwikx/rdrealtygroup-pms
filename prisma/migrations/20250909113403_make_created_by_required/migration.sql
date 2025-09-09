/*
  Warnings:

  - Made the column `createdById` on table `TenantNotice` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "TenantNotice" DROP CONSTRAINT "TenantNotice_createdById_fkey";

-- AlterTable
ALTER TABLE "TenantNotice" ALTER COLUMN "createdById" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "TenantNotice" ADD CONSTRAINT "TenantNotice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
