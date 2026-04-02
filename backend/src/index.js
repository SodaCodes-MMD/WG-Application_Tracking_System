import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import cron from "node-cron";
import app from "./app.js";
import { checkAndCreateDeadlineNotifications, sendDailyDeadlineDigest } from "./services/deadline-checker.js";

const REQUIRED_ENV_VARS = ['MONGO_URI', 'JWT_SECRET'];
for (const key of REQUIRED_ENV_VARS) {
	if (!process.env[key]) {
		console.error(`[ENV] Missing required environment variable: ${key}`);
		process.exit(1);
	}
}

console.log("SERVER STARTING...");
console.log("ENV CHECK - MONGO_URI:", process.env.MONGO_URI ? "loaded" : "MISSING");
console.log("ENV CHECK - JWT_SECRET:", process.env.JWT_SECRET ? "loaded" : "MISSING");

const CRON_TIMEZONE = process.env.CRON_TIMEZONE || 'America/New_York';

let server;
let isShuttingDown = false;

mongoose.connect(process.env.MONGO_URI)
.then(() => {
	console.log("MongoDB connected");

	cron.schedule("0 8 * * *", async () => {
		if (isShuttingDown) return;
		console.log("[CRON] Running daily deadline check...");
		try {
			await checkAndCreateDeadlineNotifications();
			await sendDailyDeadlineDigest();
		} catch (err) {
			console.error("[CRON] Deadline check failed:", err);
		}
	}, { timezone: CRON_TIMEZONE });
	console.log(`[CRON] Daily deadline check scheduled for 8:00 AM (${CRON_TIMEZONE})`);

	server = app.listen(process.env.PORT || 5000, () => {
		console.log(`Server running on port ${process.env.PORT || 5000}`);
	});
})
.catch(err => {
	console.error("MongoDB connection error:", err);
	process.exit(1);
});

const gracefulShutdown = async (signal) => {
	if (isShuttingDown) return;
	isShuttingDown = true;
	console.log(`[SHUTDOWN] Received ${signal}. Starting graceful shutdown...`);

	if (server) {
		server.close(() => {
			console.log("[SHUTDOWN] HTTP server closed");
		});
	}

	try {
		await mongoose.connection.close();
		console.log("[SHUTDOWN] MongoDB connection closed");
	} catch (err) {
		console.error("[SHUTDOWN] Error closing MongoDB:", err);
	}

	console.log("[SHUTDOWN] Graceful shutdown complete");
	process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
	console.error('[UNCAUGHT] Uncaught Exception:', err);
	gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
	console.error('[UNHANDLED] Unhandled Rejection at:', promise, 'reason:', reason);
});
