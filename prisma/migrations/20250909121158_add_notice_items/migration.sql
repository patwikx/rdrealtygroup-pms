/*
  Warnings:

  - You are about to drop the column `amount` on the `TenantNotice` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `TenantNotice` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `TenantNotice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TenantNotice" DROP COLUMN "amount",
DROP COLUMN "description",
DROP COLUMN "status",
ADD COLUMN     "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "NoticeItem" (
    "id" TEXT NOT NULL,
    "noticeId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "NoticeStatus" NOT NULL DEFAULT 'PAST_DUE',
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoticeItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NoticeItem_noticeId_idx" ON "NoticeItem"("noticeId");

-- AddForeignKey
ALTER TABLE "NoticeItem" ADD CONSTRAINT "NoticeItem_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "TenantNotice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
