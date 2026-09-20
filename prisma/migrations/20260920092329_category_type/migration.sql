-- CreateEnum
CREATE TYPE "CategoryTypes" AS ENUM ('COMPLAIN', 'SERVICE');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "type" "CategoryTypes" NOT NULL DEFAULT 'COMPLAIN';
