/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `admin_profiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `citizen_profiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `staff_profiles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `admin_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `admin_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `citizen_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `citizen_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `staff_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `staff_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "admin_profiles" ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "citizen_profiles" ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "staff_profiles" ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_email_key" ON "admin_profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "citizen_profiles_email_key" ON "citizen_profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profiles_email_key" ON "staff_profiles"("email");
