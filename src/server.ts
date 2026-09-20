import app from "./app";
import { prisma } from "./app/lib/prisma";
import { redisClient } from "./app/lib/redist";
import { seedForAdmin, seedForCitizen, seedForStaff } from "./app/utils/seed";
const PORT = process.env.PORT || 5000;

const main = async () => {
	try {
		await prisma.$connect();
		console.log("Connected to the database successfully...");

		await redisClient.connect();
		console.log("Redist Connected successfully...");

		await seedForAdmin();
		await seedForStaff();
		await seedForCitizen();

		app.listen(PORT, () => {
			console.log(`🚀 Server running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Error starting the server:", error);
		await prisma.$disconnect();
		process.exit(1);
	}
};

main();
