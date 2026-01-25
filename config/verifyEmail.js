const { json } = require("express");
const userModel = require("../models/userModel");


const verifyEmail = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await userModel.findOne({
      verificationCode: code,
    });

    if (!user) {
      return res.status(401).json({
        succes: false,
        message: "inviled Or Expored Code ",
      });
    }
    (user.isVerified = true), (user.verificationCode = undefined);
    await user.save();

    res.json({
      succes: true,
      error: false,
      message: "Email Verifed SuccessFully ",
    });
  } catch (err) {
    console.log("verification Failed ");
  }
};

module.exports = verifyEmail;
