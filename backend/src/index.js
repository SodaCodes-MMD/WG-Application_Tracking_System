import dotenv from "dotenv";
dotenv.config();   // MUST be before anything else

import express from "express";

console.log("SERVER STARTING...");
console.log("ENV TEST:", process.env.MONGO_URI);

import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/auth-routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);

mongoose.connect(process.env.MONGO_URI)
	.then(() => {
		console.log("MongoDB connected");

		app.listen(5000, () => {
			console.log("Server running on port 5000");
		});
	})
	.catch(err => console.error(err));
