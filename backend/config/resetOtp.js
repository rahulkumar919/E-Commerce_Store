const ResendOtp = async(req , res)=>{
      try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success:false, message: 'Email required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success:false, message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ success:false, message: 'Already verified' });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const mailOptions = {
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your new verification code',
      html: `<p>Your new verification code is <strong>${otp}</strong>. It will expire in ${OTP_TTL_MINUTES} minutes.</p>`,
    };
    await transporter.sendMail(mailOptions);

    res.json({ success:true, message: 'OTP resent' });
  } catch (err) {
    console.error('Resend OTP Error:', err);
    res.status(500).json({ success:false, message: 'Server error' });
  }


}

module.exports = ResendOtp 