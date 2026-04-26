import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth-routes.js";
import jobRoutes from "./routes/job-routes.js";
import profileRoutes from "./routes/profile-routes.js";
import notificationRoutes from "./routes/notification-routes.js";
import documentRoutes from "./routes/document-routes.js";

const app = express();

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "*" }));
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", jobRoutes);
app.use("/api", profileRoutes);
app.use("/api", notificationRoutes);
app.use("/api", documentRoutes);
export default app;