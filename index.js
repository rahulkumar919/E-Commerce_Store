const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
require("dotenv").config();
const router = require("./routes");
const connectDB = require("./config/db");

const app = express();

// Trust proxy — required for Vercel/Railway/Render so cookies & HTTPS work correctly
app.set("trust proxy", 1);

// CORS Configuration
const allowedOrigins = [
  "https://stmfruitshop.theartforever.com",
  "https://e-commerce-store-inky-nine.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Allow any *.vercel.app subdomain (preview deployments)
      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    exposedHeaders: ["Set-Cookie"],
    maxAge: 86400,
  })
);

app.use(express.json());
app.use(cookieParser());

// ✅ Keep-alive ping endpoint — responds instantly, wakes up the serverless function
// Call this from frontend on app load to avoid cold start delay for real API calls
app.get("/api/ping", (req, res) => {
  res.status(200).json({ success: true, message: "pong", timestamp: Date.now() });
});

app.use("/api", router);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err.message);
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ success: false, message: "CORS error: origin not allowed" });
  }
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

const PORT = process.env.PORT || 8080;

connectDB().then(() => {
  const httpServer = http.createServer(app);

  // Try to attach WebSocket if the service exists (optional)
  try {
    const { attachVoiceWebSocket } = require("./services/voice/voiceWebSocket");
    attachVoiceWebSocket(httpServer);
    console.log(`🎙️  Voice WebSocket: ws://localhost:${PORT}/ws/voice`);
  } catch {
    console.log("ℹ️  Voice WebSocket not available (services/voice folder missing)");
  }

  httpServer.listen(PORT, () => {
    console.log("✅ Connected To DB");
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
