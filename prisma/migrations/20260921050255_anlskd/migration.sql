-- DropForeignKey
ALTER TABLE "feedbacks" DROP CONSTRAINT "feedbacks_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "service_requests" DROP CONSTRAINT "service_requests_citizenId_fkey";

-- AlterTable
ALTER TABLE "service_requests" ADD COLUMN     "serviceImages" JSONB;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizen_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizen_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
