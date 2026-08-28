const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const router = require("./routes");
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

// Permissive dynamic CORS middleware
const allowedOrigins = [
  "https://e-commerce-fronted-gamma.vercel.app",
  "https://stmfruitshop.theartforever.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token",
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
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
  }),
);

app.use(express.json());
app.use(cookieParser());

// Serverless deployments import this app instead of running startServer().
// Establish the shared MongoDB connection before handling those requests.
app.use(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    next();
  } catch (error) {
    next(error);
  }
});

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

async function startServer() {
  const port = Number(process.env.PORT) || 8080;

  try {
    await ensureDatabaseConnection();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Unable to start the server:", error.message);
    process.exit(1);
  }
}

// Vercel imports the Express app. Only open a local HTTP server when this file
// is executed directly (for example, with `npm start` or `npm run dev`).
if (require.main === module) {
  startServer();
}

module.exports = app;
