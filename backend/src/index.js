/*
 * S3-022: graceful shutdown on SIGTERM/SIGINT — closes HTTP server then
 * disconnects Mongoose before exiting so in-flight requests are not cut off.
 */
import dotenv from "dotenv";
dotenv.config(); // Must be the very first executable line to ensure env vars are loaded before use.

import mongoose from "mongoose";
import cron from "node-cron";
import app from "./app.js";
import { checkAndCreateDeadlineNotifications, sendDailyDeadlineDigest } from "./services/deadline-checker.js";

console.log("SERVER STARTING...");
console.log("ENV CHECK - MONGO_URI:", process.env.MONGO_URI ? "loaded" : "MISSING");
console.log("ENV CHECK - JWT_SECRET:", process.env.JWT_SECRET ? "loaded" : "MISSING");
console.log("ENV CHECK - GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "loaded" : "MISSING");

mongoose.connect(process.env.MONGO_URI)
.then(() => {
	console.log("MongoDB connected");

	cron.schedule("0 8 * * *", async () => {
		console.log("[CRON] Running daily deadline check...");
		try {
			await checkAndCreateDeadlineNotifications();
			await sendDailyDeadlineDigest();
		} catch (err) {
			console.error("[CRON] Deadline check failed:", err);
		}
	});
	console.log("[CRON] Daily deadline check scheduled for 8:00 AM");

	const server = app.listen(process.env.PORT || 5000, () => {
		console.log(`Server running on port ${process.env.PORT || 5000}`);
	});

	const shutdown = async (signal) => {
		console.log(`[${signal}] Graceful shutdown initiated`);
		server.close(async () => {
			try {
				await mongoose.disconnect();
				console.log("[shutdown] MongoDB disconnected");
			} catch (err) {
				console.error("[shutdown] MongoDB disconnect error:", err);
			}
			process.exit(0);
		});
	};

	process.on("SIGTERM", () => shutdown("SIGTERM"));
	process.on("SIGINT", () => shutdown("SIGINT"));
})
.catch(err => console.error("MongoDB connection error:", err));
