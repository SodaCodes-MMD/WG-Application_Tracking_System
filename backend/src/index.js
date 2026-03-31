import dotenv from "dotenv";
dotenv.config(); // Must be the very first executable line

import mongoose from "mongoose";
import app from "./app.js";

console.log("SERVER STARTING...");
console.log("ENV CHECK - MONGO_URI:", process.env.MONGO_URI ? "loaded" : "MISSING");
console.log("ENV CHECK - JWT_SECRET:", process.env.JWT_SECRET ? "loaded" : "MISSING");

mongoose.connect(process.env.MONGO_URI)
.then(() => {
	console.log("MongoDB connected");

	app.listen(process.env.PORT || 5000, () => {
		console.log(`Server running on port ${process.env.PORT || 5000}`);
	});
})
.catch(err => console.error("MongoDB connection error:", err));
