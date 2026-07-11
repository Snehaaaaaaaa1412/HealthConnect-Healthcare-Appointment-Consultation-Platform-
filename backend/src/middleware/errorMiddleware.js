"use strict";

const { ApiError } = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const env = require("../config/env");

/**
 * Global Error Handling Middleware
 *
 * Responsibility:
 *   Intercepts all thrown operational errors (ApiError) and non-operational
 *   system errors (such as sqlite3 or multer), returning a standardized
 *   ApiResponse JSON payload with correct HTTP status codes.
 */
const errorMiddleware = (err, req, res, next) => {
  // If headers have already been sent, delegate to Express to avoid crashes
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errorCode = err.errorCode || "INTERNAL_ERROR";

  // Standardize Multer and custom upload filters
  if (err.name === "MulterError") {
    statusCode = 400;
    errorCode = "UPLOAD_ERROR";
    message = `File upload error: ${err.message}`;
  } else if (err.message === "Only PDF and image files are allowed") {
    statusCode = 400;
    errorCode = "INVALID_FILE_TYPE";
    message = err.message;
  }

  const errorDetail = {
    code: errorCode,
    message: message,
  };

  // Stack trace is added only for development environments
  if (env.NODE_ENV === "development") {
    errorDetail.stack = err.stack;
  }

  res.status(statusCode).json(
    new ApiResponse(statusCode, false, null, null, errorDetail)
  );
};

module.exports = errorMiddleware;
