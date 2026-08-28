const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const router = require("./routes");
const connectDB = require("./config/db");

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: [
      "https://e-commerce-fronted-gamma.vercel.app",
      "https://stmfruitshop.theartforever.com",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get("/api/ping", (req, res) => {
  res.status(200).json({
    success: true,
    message: "pong",
    timestamp: Date.now(),
  });
});

app.use("/api", router);

app.use((err, req, res, next) => {
  console.error("Global Error:", err);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

module.exports = app;
