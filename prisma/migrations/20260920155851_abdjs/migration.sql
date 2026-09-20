-- DropForeignKey
ALTER TABLE "complaints" DROP CONSTRAINT "complaints_citizenId_fkey";

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizen_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
