const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendMail } = require("../utils/mailer");
const { generateOtp, hashOtp } = require("../utils/otp");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      isEmailVerified: false,
    });

    const otp = generateOtp();

    user.emailOtpHash = hashOtp(otp);
    user.emailOtpExpiresAt = new Date(
      Date.now() + Number(process.env.OTP_EXPIRES_MIN || 10) * 60 * 1000,
    );
    user.emailOtpAttempts = 0;

    await user.save();

    await sendMail({
      to: user.email,
      subject: "Verify your AdoptMe email",
      text: `Your verification code is: ${otp} It expires in ${process.env.OTP_EXPIRES_MIN || 10} minutes.`,
    });

    return res.status(201).json({
      message: "Registered successfully. OTP sent to email.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: "Registration failed" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isEmailVerified) {
      return res
        .status(403)
        .json({ message: "Email not verified. Please verify OTP." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Login failed" });
  }
};

const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isEmailVerified)
      return res.json({ message: "Email already verified" });

    if (!user.emailOtpHash || !user.emailOtpExpiresAt) {
      return res
        .status(400)
        .json({ message: "No OTP found. Please resend OTP." });
    }

    if (user.emailOtpAttempts >= 5) {
      return res
        .status(429)
        .json({ message: "Too many attempts. Please resend OTP." });
    }

    if (user.emailOtpExpiresAt < new Date()) {
      return res
        .status(400)
        .json({ message: "OTP expired. Please resend OTP." });
    }

    const { hashOtp } = require("../utils/otp");
    const isMatch = user.emailOtpHash === hashOtp(String(otp).trim());

    user.emailOtpAttempts += 1;

    if (!isMatch) {
      await user.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.isEmailVerified = true;
    user.emailOtpHash = "";
    user.emailOtpExpiresAt = null;
    user.emailOtpAttempts = 0;
    await user.save();

    return res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    return res.status(500).json({ message: "Verification failed" });
  }
};

const resendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isEmailVerified)
      return res.json({ message: "Email already verified" });

    const { generateOtp, hashOtp } = require("../utils/otp");
    const { sendMail } = require("../utils/mailer");

    const otp = generateOtp();
    user.emailOtpHash = hashOtp(otp);
    user.emailOtpExpiresAt = new Date(
      Date.now() + Number(process.env.OTP_EXPIRES_MIN || 10) * 60 * 1000,
    );
    user.emailOtpAttempts = 0;
    await user.save();

    await sendMail({
      to: user.email,
      subject: "Your new AdoptMe verification code",
      text: `Your new verification code is: ${otp}\nIt expires in ${process.env.OTP_EXPIRES_MIN || 10} minutes.`,
    });

    return res.json({ message: "OTP resent" });
  } catch (err) {
    console.error("RESEND OTP ERROR:", err);
    return res.status(500).json({ message: "Failed to resend OTP" });
  }
};

module.exports = {
  register,
  login,
  verifyEmailOtp,
  resendEmailOtp,
};
