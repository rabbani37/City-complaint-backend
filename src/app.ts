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
import { UsersRoutes } from "./app/module/users/users.routes";
import { DepartmentRoutes } from "./app/module/department/department.routes";
import { CategoryRoutes } from "./app/module/category/category.routes";
import { ComplaintsRoutes } from "./app/module/complaints/complaints.routes";
import { TaskAssignedRoutes } from "./app/module/taskAssigned/taskAssigned.routes";

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/users", UsersRoutes);
app.use("/api/v1/departments", DepartmentRoutes);
app.use("/api/v1/categories", CategoryRoutes);
app.use("/api/v1/complaints", ComplaintsRoutes);
app.use("/api/v1", TaskAssignedRoutes);

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
