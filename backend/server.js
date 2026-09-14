require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const { startReminderScheduler } = require("./services/reminderScheduler");

const memberRoutes = require("./routes/members");
const whatsappRoutes = require("./routes/whatsapp");
const settingsRoutes = require("./routes/settings");

const app = express();

// --- Middleware ---
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",");
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded member photos
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Routes ---
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// Fail fast with a clear message instead of a 10s Mongoose buffering
// timeout when the database isn't reachable yet.
const DB_INDEPENDENT_PATHS = ["/health", "/whatsapp/status"];
app.use("/api", (req, res, next) => {
  if (DB_INDEPENDENT_PATHS.includes(req.path)) return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: "Database not connected. Check MONGO_URI in backend/.env and make sure MongoDB is running.",
    });
  }
  next();
});

app.use("/api/members", memberRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/settings", settingsRoutes);

// --- 404 + error handling ---
app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

app.use((err, req, res, next) => {
  console.error("[Error]", err.message);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  startReminderScheduler();
  app.listen(PORT, () => {
    console.log(`[B-FITNESS API] running on http://localhost:${PORT}`);
  });
}

start();
