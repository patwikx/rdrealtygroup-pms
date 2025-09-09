-- DropForeignKey
ALTER TABLE "TenantNotice" DROP CONSTRAINT "TenantNotice_createdById_fkey";

-- AlterTable
ALTER TABLE "TenantNotice" ALTER COLUMN "createdById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "TenantNotice" ADD CONSTRAINT "TenantNotice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
