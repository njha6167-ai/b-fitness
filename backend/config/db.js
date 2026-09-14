const mongoose = require("mongoose");

/**
 * Connects to MongoDB using MONGO_URI from .env.
 * The server is designed to keep running (so the API stays reachable
 * and you can see clear errors in the terminal) even if the very
 * first connection attempt fails — but every DB-dependent route will
 * return a 503 until the connection succeeds.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bfitness";

  mongoose.connection.on("connected", () => {
    console.log(`[MongoDB] connected -> ${mongoose.connection.name}`);
  });

  mongoose.connection.on("error", (err) => {
    console.error("[MongoDB] connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[MongoDB] disconnected");
  });

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (err) {
    console.error(
      "[MongoDB] Initial connection failed:",
      err.message,
      "\n  -> Check MONGO_URI in backend/.env. The server will keep retrying in the background is NOT enabled by default; restart after fixing the URI."
    );
  }
}

module.exports = connectDB;
