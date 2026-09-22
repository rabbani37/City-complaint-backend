/*
  Warnings:

  - Made the column `location` on table `complaints` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `location` to the `service_requests` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "task_assigneds" DROP CONSTRAINT "task_assigneds_staffId_fkey";

-- AlterTable
ALTER TABLE "complaints" ALTER COLUMN "location" SET NOT NULL;

-- AlterTable
ALTER TABLE "service_requests" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "task_assigneds" ADD CONSTRAINT "task_assigneds_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
