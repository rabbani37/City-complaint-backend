import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
	node_env: process.env.NODE_ENV,
	port: process.env.PORT,
	database_url: process.env.DATABASE_URL,
	// bak_url: process.env.APP_URL,
	frontend_url: process.env.FRONTEND_URL,
	google_client_id: process.env.GOOGLE_CLIENT_ID!,

	bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,

	jwt_access_secret: process.env.JWT_ACCESS_SECRET!,
	jwt_refresh_secret: process.env.JWT_REFRESH_SECRET!,

	jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN!,
	jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN!,

	test_admin_name: process.env.TEST_ADMIN_NAME!,
	test_admin_email: process.env.TEST_ADMIN_EMAIL!,
	test_admin_password: process.env.TEST_ADMIN_PASSWORD!,

	test_staff_name: process.env.TEST_STAFF_NAME!,
	test_staff_email: process.env.TEST_STAFF_EMAIL!,
	test_staff_password: process.env.TEST_STAFF_PASSWORD!,

	test_citizen_name: process.env.TEST_CITIZEN_NAME!,
	test_citizen_email: process.env.TEST_CITIZEN_EMAIL!,
	test_citizen_password: process.env.TEST_CITIZEN_PASSWORD!,

	redist_user: process.env.REDIS_USER!,
	redist_password: process.env.REDIS_PASSWORD!,
	redist_host: process.env.REDIS_HOST!,
	redist_port: process.env.REDIS_PORT!,

	smtp_user: process.env.SMTP_USER!,
	smtp_password: process.env.SMTP_PASSWORD!,
	smtp_sender: process.env.EMAIL_SENDER!,

	cloudinary_name: process.env.CLOUDINARY_CLOUD_NAME!,
	cloudinary_api_key: process.env.CLOUDINARY_API_KEY!,
	cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET!,

	// bkash_base_url: process.env.BKASH_BASE_URL!,
	// bkash_username: process.env.BKASH_USERNAME!,
	// bkash_password: process.env.BKASH_PASSWORD!,
	// bkash_app_key: process.env.BKASH_APP_KEY!,
	// bkash_app_secret: process.env.BKASH_APP_SECRET!,
	// bKash_callback_url:process.env.BKASH_CALLBACK_URL
};
