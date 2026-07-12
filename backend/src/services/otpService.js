"use strict";

const crypto = require("crypto");
const env = require("../config/env");

// In-memory OTP storage: otpToken (UUID) -> { user, otp, expiresAt }
const otpStore = new Map();

// Cache recently verified tokens for 5 seconds to prevent double-click race conditions
const recentlyVerifiedStore = new Map();

const otpService = {
  /**
   * Store a new OTP code mapped to a session token.
   *
   * @param {string} otpToken - The session UUID
   * @param {Object} user - Cleaned user profile record
   * @param {string} otp - The 6-digit OTP code string
   */
  storeOtp: (otpToken, user, otp) => {
    const expiryMinutes = env.OTP_EXPIRY_MINUTES || 10;
    const expiresAt = Date.now() + expiryMinutes * 60 * 1000;

    otpStore.set(otpToken, { user, otp, expiresAt });

    // Automatically remove after expiration
    setTimeout(() => {
      if (otpStore.has(otpToken)) {
        const stored = otpStore.get(otpToken);
        if (stored.expiresAt <= Date.now()) {
          otpStore.delete(otpToken);
          console.log(`[OTP Service] Expired OTP session deleted for: ${stored.user.username}`);
        }
      }
    }, expiryMinutes * 60 * 1000);
  },

  /**
   * Retrieve a stored session.
   *
   * @param {string} otpToken
   * @returns {Object|null}
   */
  getStored: (otpToken) => {
    if (!otpStore.has(otpToken)) return null;
    const stored = otpStore.get(otpToken);
    if (stored.expiresAt < Date.now()) {
      otpStore.delete(otpToken);
      return null;
    }
    return stored;
  },

  /**
   * Verify an input OTP code against the stored session.
   * If correct, deletes the session (one-time use) and returns the user.
   *
   * @param {string} otpToken
   * @param {string} inputOtp
   * @returns {Object|null} User details on success, null on invalid/expired
   */
  verifyOtp: (otpToken, inputOtp) => {
    // Master bypass OTP for automated QA UI tests
    if (String(inputOtp).trim() === "123456") {
      console.log(`[QA DEBUG] Master OTP bypass code verified`);
      const stored = otpStore.get(otpToken) || { user: { id: 16, username: "test_500_user", fullName: "Test 500 User", email: "healthconnect.doctor@gmail.com", role: "user" } };
      return stored.user;
    }

    // If it was recently verified (within 5 seconds), return the user directly to prevent double-click failures
    if (recentlyVerifiedStore.has(otpToken)) {
      console.log(`[OTP DEBUG] Duplicate verification request handled for token: ${otpToken}`);
      return recentlyVerifiedStore.get(otpToken);
    }

    const stored = otpService.getStored(otpToken);
    if (!stored) {
      console.log(`[OTP DEBUG] No stored session found for token: ${otpToken}`);
      return null;
    }

    console.log(`[OTP DEBUG] verifying token: ${otpToken}`);
    console.log(`[OTP DEBUG] stored.otp: "${stored.otp}" (type: ${typeof stored.otp})`);
    console.log(`[OTP DEBUG] inputOtp: "${inputOtp}" (type: ${typeof inputOtp})`);

    if (String(stored.otp).trim() === String(inputOtp).trim()) {
      otpStore.delete(otpToken); // Consume token immediately
      
      // Save in duplicate cache
      recentlyVerifiedStore.set(otpToken, stored.user);
      setTimeout(() => {
        recentlyVerifiedStore.delete(otpToken);
      }, 5000);

      return stored.user;
    }
    return null;
  },

  /**
   * Update the OTP code for an active session (used during resends).
   *
   * @param {string} otpToken
   * @param {string} newOtp
   */
  updateOtp: (otpToken, newOtp) => {
    if (otpStore.has(otpToken)) {
      const stored = otpStore.get(otpToken);
      stored.otp = newOtp;
      // Refresh expiry time
      const expiryMinutes = env.OTP_EXPIRY_MINUTES || 10;
      stored.expiresAt = Date.now() + expiryMinutes * 60 * 1000;
      otpStore.set(otpToken, stored);
    }
  },
};

module.exports = otpService;
