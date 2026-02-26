const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const router = require("./routes");
const connectDB = require("./config/db");

const app = express();

app.use(cors({
  origin: [
     "http://localhost:5173",
    "https://e-commerce-frontened-mauve.vercel.app",
    "http://localhost:3000",
    "http://localhost:5174",
  ],
  credentials: true
}));


app.use(express.json());
app.use(cookieParser()); 


app.use("/api", router);

const PORT = process.env.PORT || 8080;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(" Connected To Db");
    console.log(`Server running at http://localhost:${PORT}`);
  });
});
