import express, {
	type Application,
	type Request,
	type Response,
} from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AuthRoutes } from "./app/module/auth/auth.routes";
import { notFound } from "./app/middleware/notFound";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/v1/auth", AuthRoutes);

app.get("/api/v1/health", (_req: Request, res: Response) => {
	res.status(200).json({
		success: true,
		message: "API is running",
		data: {},
	});
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
