const express = require("express");
const router = express.Router();
const {
  register,
  login,
  verifyEmailOtp,
  resendEmailOtp,
} = require("../controllers/auth.controller");
const validate = require("../middleware/validate");
const { registerSchema, loginSchema } = require("../validators/auth.schema");

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

router.post("/verify-email", verifyEmailOtp);
router.post("/resend-otp", resendEmailOtp);


module.exports = router;
