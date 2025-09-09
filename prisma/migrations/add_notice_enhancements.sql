-- Add new fields to NoticeItem table
ALTER TABLE "NoticeItem" ADD COLUMN "customStatus" TEXT;
ALTER TABLE "NoticeItem" ADD COLUMN "months" TEXT;

-- Add new enum values to NoticeStatus
ALTER TYPE "NoticeStatus" ADD VALUE 'PENDING';
ALTER TYPE "NoticeStatus" ADD VALUE 'UNPAID';
ALTER TYPE "NoticeStatus" ADD VALUE 'CUSTOM';