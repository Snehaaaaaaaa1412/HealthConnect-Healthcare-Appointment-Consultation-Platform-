"use strict";

const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const userService = require("../services/userService");
const doctorService = require("../services/doctorService");
const vendorService = require("../services/vendorService");
const otpService = require("../services/otpService");
const emailService = require("../services/emailService");
const asyncHandler = require("../utils/asyncHandler");

// Helper to sign JWTs
const generateToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
};

const authController = {
  /**
   * Register a new user (patient, doctor, or vendor)
   */
  register: asyncHandler(async (req, res) => {
    const { fullName, username, password, mobile, email, role, specialization, storeName, gender, age } = req.body;

    if (role === "user") {
      try {
        const result = await userService.registerUser({ fullName, username, password, mobile, email, gender, age });
        return res.json(result);
      } catch (err) {
        if (err.isUniqueViolation) return res.json({ error: "Username is already taken" });
        throw err;
      }
    }

    if (role === "doctor") {
      try {
        const result = await doctorService.registerDoctor({ fullName, username, password, mobile, email, specialization });
        return res.json(result);
      } catch (err) {
        if (err.isUniqueViolation) return res.json({ error: "Username is already taken" });
        throw err;
      }
    }

    if (role === "vendor") {
      try {
        const result = await vendorService.registerVendor({ fullName, username, password, mobile, email, storeName });
        return res.json(result);
      } catch (err) {
        if (err.isUniqueViolation) return res.json({ error: "Username is already taken" });
        throw err;
      }
    }

    return res.json({ error: "Invalid role specified" });
  }),

  /**
   * Login user (patient/doctor/vendor/admin)
   */
  login: asyncHandler(async (req, res) => {
    const { username, password, role } = req.body;

    if (role === "admin") {
      if (username === "admin" && password === "admin") {
        const token = generateToken({ id: 0, username: "admin", role: "admin" });
        return res.json({
          message: "Login successful",
          token,
          user: { id: 0, fullName: "System Administrator", username: "admin" }
        });
      }
      return res.json({ message: "Invalid credentials" });
    }

    if (role === "user") {
      const cleanUser = await userService.loginUser(username, password);
      if (!cleanUser) return res.json({ message: "Invalid credentials" });

      const otpToken = crypto.randomUUID();
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      otpService.storeOtp(otpToken, cleanUser, otp);
      emailService.sendOtpEmail(cleanUser.email, cleanUser.fullName, otp);

      return res.json({ requiresOTP: true, otpToken, email: cleanUser.email });
    }

    if (role === "vendor") {
      const cleanVendor = await vendorService.loginVendor(username, password);
      if (!cleanVendor) return res.json({ message: "Invalid credentials" });
      const token = generateToken({ id: cleanVendor.id, username: cleanVendor.username, role: "vendor" });
      return res.json({ message: "Login successful", token, user: cleanVendor });
    }

    if (role === "doctor") {
      const cleanDoctor = await doctorService.loginDoctor(username, password);
      if (!cleanDoctor) return res.json({ message: "Invalid credentials" });
      const token = generateToken({ id: cleanDoctor.id, username: cleanDoctor.username, role: "doctor" });
      return res.json({ message: "Login successful", token, user: cleanDoctor });
    }

    return res.json({ message: "Invalid role specified" });
  }),

  /**
   * Verify OTP token
   */
  verifyOtp: asyncHandler(async (req, res) => {
    const { otpToken, otp } = req.body;
    const verifiedUser = otpService.verifyOtp(otpToken, otp);

    if (!verifiedUser) {
      return res.json({ error: "Incorrect 6-digit OTP. Please check your email and try again." });
    }

    const token = generateToken({ id: verifiedUser.id, username: verifiedUser.username, role: "user" });
    return res.json({ message: "Login successful", token, user: verifiedUser });
  }),

  /**
   * Resend OTP token
   */
  resendOtp: asyncHandler(async (req, res) => {
    const { otpToken } = req.body;
    const stored = otpService.getStored(otpToken);

    if (!stored) {
      return res.json({ error: "OTP request session expired. Please log in again." });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    otpService.updateOtp(otpToken, newOtp);
    emailService.sendOtpEmail(stored.user.email, stored.user.fullName, newOtp);

    return res.json({ message: "OTP resent successfully" });
  })
};

module.exports = authController;
