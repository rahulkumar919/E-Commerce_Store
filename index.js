const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const router = require("./routes");
const connectDB = require("./config/db");

const app = express();

// CORS Configuration - Allow all origins for production
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  exposedHeaders: ["Set-Cookie"],
  maxAge: 86400, // 24 hours
}));

// Additional CORS headers middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  
  next();
});


app.use(express.json());
app.use(cookieParser());


app.use("/api", router);

const PORT = process.env.PORT || 8080;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(" Connected To Db");
    console.log(`Server running at https://e-commerce-store-inky-nine.vercel.app/`);
  });
});
