import { tr } from "zod/locales";
import { Role } from "../../generated/prisma/enums";
import config from "../config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";

export const seedForAdmin = async () => {
	try {
		const isAdmin = await prisma.user.findFirst({
			where: { role: Role.ADMIN },
		});

		if (isAdmin) {
			console.log("Admin Already Exsist In Database... ");
			return;
		}

		const name = config.test_admin_name;
		const email = config.test_admin_email;
		const password = config.test_admin_password;

		const hashPass = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const createAdmin = await prisma.user.create({
			data: {
				name,
				email,
				password: hashPass,
				role: Role.ADMIN,
				emailVerified: true,
				adminProfile: {
					create: {
						name,
						email,
					},
				},
			},
			omit: { password: true },
		});

		console.log(`New Admin created:`, createAdmin);
	} catch (error) {
		console.log(`Error For Seed Admin: ${error}`);
	}
};

export const seedForStaff = async () => {
	try {
		const isStaff = await prisma.user.findFirst({
			where: { role: Role.STAFF },
		});

		if (isStaff) {
			console.log("Staff Already Exsist In Database... ");
			return;
		}

		// 1. Fetch a real Admin user from the database to approve the staff
		const adminUser = await prisma.user.findFirst({
			where: { role: Role.ADMIN },
			include: { adminProfile: true },
		});

		// Fallback: If no admin is found, wait or throw an error
		if (!adminUser) {
			console.log(
				"No Admin found to approve staff. Make sure seedForAdmin runs first!",
			);
			return;
		}

		// 2. Fetch a real Department (or create a default one if none exists)
		let department = await prisma.department.findFirst();

		if (!department) {
			department = await prisma.department.create({
				data: {
					name: "Engineering and Utilities", // Replace with fields your Department schema uses
				},
			});
			console.log("Created a default department for seeding staff.");
		}

		const name = config.test_staff_name;
		const email = config.test_staff_email;
		const password = config.test_staff_password;

		const hashPass = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		// 3. Create the staff member with the REAL IDs fetched above
		const createStaff = await prisma.user.create({
			data: {
				name,
				email,
				password: hashPass,
				role: Role.STAFF,
				emailVerified: true,
				staffProfile: {
					create: {
						name,
						email,
						experienceYears: 5,
						expertise: "electrician",
						nid: "0123456",
						approvedById: adminUser.adminProfile?.id as string, // Fixed: Now uses real Admin ID
						departmentId: department.id, // Fixed: Now uses real Department ID
					},
				},
			},
			omit: { password: true },
		});

		console.log(`New Staff created:`, createStaff);
	} catch (error) {
		console.log(`Error For Seed Staff: `, error);
	}
};

export const seedForCitizen = async () => {
	try {
		const isCitizen = await prisma.user.findFirst({
			where: { role: Role.CITIZEN },
		});

		if (isCitizen) {
			console.log("Citizen Already Exsist In Database... ");
			return;
		}

		const name = config.test_citizen_name;
		const email = config.test_citizen_email;
		const password = config.test_citizen_password;

		const hashPass = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const createCitizen = await prisma.user.create({
			data: {
				name,
				email,
				password: hashPass,
				role: Role.CITIZEN,
				emailVerified: true,
				citizenProfile: {
					create: {
						name,
						email,
					},
				},
			},
			omit: { password: true },
		});

		console.log(`New Citizen created:`, createCitizen);
	} catch (error) {
		console.log(`Error For Citizen Staff: ${error}`, error);
	}
};
