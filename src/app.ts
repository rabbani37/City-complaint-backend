import express, { type Application, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());












app.get("/api/v1/health", (_req: Request, res: Response) => {
	res.status(200).json({
		success: true,
		message: "API is running",
		data: {},
	});
});

export default app;
