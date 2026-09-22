-- DropForeignKey
ALTER TABLE "staff_profiles" DROP CONSTRAINT "staff_profiles_approvedById_fkey";

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "admin_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
