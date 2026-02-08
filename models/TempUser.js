const mongoose = require("mongoose");
const { emit } = require("./userModel");

const tempUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  otp: String,
  otpExpires: Date,
});

module.exports = mongoose.model("TempUser" , tempUserSchema) ;