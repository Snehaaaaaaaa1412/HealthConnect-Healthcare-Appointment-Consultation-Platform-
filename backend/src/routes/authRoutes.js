"use strict";

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// POST /register
router.post("/register", authController.register);

// POST /login
router.post("/login", authController.login);

// POST /auth/verify-otp
router.post("/auth/verify-otp", authController.verifyOtp);

// POST /auth/resend-otp
router.post("/auth/resend-otp", authController.resendOtp);

module.exports = router;
