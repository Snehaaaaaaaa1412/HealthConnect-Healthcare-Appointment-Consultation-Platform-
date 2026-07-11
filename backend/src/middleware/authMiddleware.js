"use strict";

const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { ApiError, AuthenticationError } = require("../utils/ApiError");

/**
 * Authentication & Authorization Middleware
 *
 * Responsibility:
 *   Protect non-public endpoints via JWT verification.
 *   Contains a path-based whitelist to automatically bypass public endpoints.
 */
const authMiddleware = {
  /**
   * Verify JWT bearer token in Authorization header and assign decoded payload to req.user.
   */
  protect: (req, res, next) => {
    const path = req.path.replace(/\/$/, "");
    const method = req.method;

    // Centralized whitelist of completely public endpoints
    const publicRoutes = [
      { path: "/register", method: "POST" },
      { path: "/login", method: "POST" },
      { path: "/auth/verify-otp", method: "POST" },
      { path: "/auth/resend-otp", method: "POST" },
      { path: "/health", method: "GET" },
      { path: "/public/doctors", method: "GET" },
      { path: "/public/vendors", method: "GET" }
    ];

    const isPublic = publicRoutes.some(
      (route) => route.path === path && route.method === method
    );

    if (isPublic) {
      return next();
    }

    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AuthenticationError("Access denied. No authentication token provided.")
      );
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, env.JWT_SECRET);
      
      // Mount user payload (contains id, username, role) to the request object
      req.user = decoded;
      next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return next(new AuthenticationError("Your session has expired. Please log in again."));
      }
      return next(new AuthenticationError("Authentication failed. Invalid token."));
    }
  },

  /**
   * Restrict access to specific roles.
   *
   * @param  {...string} roles
   */
  restrictTo: (...roles) => {
    return (req, res, next) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return next(
          new ApiError("You do not have permission to perform this action.", 403, "FORBIDDEN_ACCESS")
        );
      }
      next();
    };
  },
};

module.exports = authMiddleware;
