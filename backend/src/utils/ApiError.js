"use strict";

/**
 * ApiError
 *
 * Responsibility:
 *   Base Custom Error class for operational errors.
 */
class ApiError extends Error {
  constructor(message, statusCode = 500, errorCode = "INTERNAL_ERROR", isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * ValidationError (400)
 */
class ValidationError extends ApiError {
  constructor(message, errorCode = "VALIDATION_ERROR") {
    super(message, 400, errorCode);
  }
}

/**
 * AuthenticationError (401)
 */
class AuthenticationError extends ApiError {
  constructor(message, errorCode = "UNAUTHENTICATED") {
    super(message, 401, errorCode);
  }
}

/**
 * NotFoundError (404)
 */
class NotFoundError extends ApiError {
  constructor(message, errorCode = "NOT_FOUND") {
    super(message, 404, errorCode);
  }
}

/**
 * ConflictError (409)
 */
class ConflictError extends ApiError {
  constructor(message, errorCode = "CONFLICT") {
    super(message, 409, errorCode);
  }
}

module.exports = {
  ApiError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
};
