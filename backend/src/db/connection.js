import mongoose from "mongoose";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

const connectionOptions = {
  maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE, 10) || 10,
  minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE, 10) || 5,
  serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 10) || 10000,
  socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT_MS, 10) || 45000,
  connectTimeoutMS: parseInt(process.env.MONGO_CONNECT_TIMEOUT_MS, 10) || 20000,
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 10000,
};

async function connectWithRetry(retryCount = 0) {
  try {
    await mongoose.connect(process.env.MONGO_URI, connectionOptions);
    console.log("[DB] MongoDB connected successfully");
  } catch (err) {
    if (retryCount < MAX_RETRIES) {
      console.error(`[DB] Connection attempt ${retryCount + 1} failed. Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return connectWithRetry(retryCount + 1);
    }
    console.error("[DB] All connection attempts failed:", err.message);
    throw err;
  }
}

let listenersRegistered = false;

function registerEventListeners() {
  if (listenersRegistered) return;
  
  mongoose.connection.on("error", err => {
    console.error("[DB] Connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[DB] MongoDB disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("[DB] MongoDB reconnected");
  });

  listenersRegistered = true;
}

export const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is not set");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  registerEventListeners();

  await connectWithRetry();
  return mongoose.connection;
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("[DB] MongoDB disconnected gracefully");
  } catch (err) {
    console.error("[DB] Error during disconnect:", err.message);
    throw err;
  }
};
