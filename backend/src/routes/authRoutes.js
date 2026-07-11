"use strict";

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const validate = require("../middleware/validationMiddleware");

// Validation Schemas
const registerSchema = {
  fullName: { required: true, minLength: 3, maxLength: 50 },
  username: { required: true, minLength: 3, maxLength: 30 },
  password: { required: true, minLength: 4, maxLength: 100 },
  mobile: { required: true, type: "phone" },
  email: { required: true, type: "email" },
  role: { required: true, enum: ["user", "doctor", "vendor"] }
};

const loginSchema = {
  username: { required: true, minLength: 3 },
  password: { required: true, minLength: 4 },
  role: { required: true, enum: ["user", "doctor", "vendor", "admin"] }
};

const verifyOtpSchema = {
  otpToken: { required: true },
  otp: { required: true, minLength: 6, maxLength: 6 }
};

const resendOtpSchema = {
  otpToken: { required: true }
};

// POST /register
router.post("/register", validate(registerSchema), authController.register);

// POST /login
router.post("/login", validate(loginSchema), authController.login);

// POST /auth/verify-otp
router.post("/auth/verify-otp", validate(verifyOtpSchema), authController.verifyOtp);

// POST /auth/resend-otp
router.post("/auth/resend-otp", validate(resendOtpSchema), authController.resendOtp);

module.exports = router;
