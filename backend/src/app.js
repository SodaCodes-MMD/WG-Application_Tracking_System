import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth-routes.js";
import jobRoutes from "./routes/job-routes.js";
import profileRoutes from "./routes/profile-routes.js";
import notificationRoutes from "./routes/notification-routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", jobRoutes);
app.use("/api", profileRoutes);
app.use("/api", notificationRoutes);

export default app;