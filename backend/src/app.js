/*
 * S3-022: added GET /api/health endpoint for deployment health checks.
 */
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth-routes.js";
import jobRoutes from "./routes/job-routes.js";
import profileRoutes from "./routes/profile-routes.js";
import notificationRoutes from "./routes/notification-routes.js";
import documentRoutes from "./routes/document-routes.js";
import { requestLogger, errorHandler } from "./middleware/error-middleware.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:3000",
  ...(process.env.ALLOWED_ORIGIN
    ? process.env.ALLOWED_ORIGIN.split(",").map(o => o.trim().replace(/^https?:\/\//, "https://"))
    : []),
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(requestLogger);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.use("/api", authRoutes);
app.use("/api", jobRoutes);
app.use("/api", profileRoutes);
app.use("/api", notificationRoutes);
app.use("/api", documentRoutes);

app.use(errorHandler);
export default app;