const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config(); // loaded environment variables & models

const router   = require("./routes");
const aiRouter = require("./routes/aiRoutes");
const connectDB = require("./config/db");

const app = express();
let databaseConnectionPromise;

function ensureDatabaseConnection() {
  if (!databaseConnectionPromise) {
    databaseConnectionPromise = connectDB().catch((error) => {
      databaseConnectionPromise = undefined;
      throw error;
    });
  }
  return databaseConnectionPromise;
}

app.set("trust proxy", 1);

// Allowed origins — edit this list to add/remove domains
const allowedOrigins = [
  "https://e-commerce-fronted-gamma.vercel.app",
  "https://stmfruitshop.theartforever.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

// Single, clean CORS setup
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, mobile apps, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "X-CSRF-Token",
    ],
  })
);

app.use(express.json());
app.use(cookieParser());

// Lazy MongoDB connection — established once, reused on every request
app.use(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    next();
  } catch (error) {
    next(error);
  }
});

// Health-check / warm-up ping
app.get("/api/ping", (req, res) => {
  res.status(200).json({ success: true, message: "pong", timestamp: Date.now() });
});

app.use("/api", router);
app.use("/api/ai", aiRouter);  // AI assistant routes

// Global error handler
app.use((err, req, res, next) => {
  // Surface CORS errors clearly
  if (err.message && err.message.startsWith("CORS:")) {
    return res.status(403).json({ success: false, message: err.message });
  }
  console.error("Global Error:", err);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

async function startServer() {
  const port = Number(process.env.PORT) || 8080;
  try {
    await ensureDatabaseConnection();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error.message);
    process.exit(1);
  }
}

// Only open an HTTP server when run directly (not on Vercel)
if (require.main === module) {
  startServer();
}

module.exports = app;
