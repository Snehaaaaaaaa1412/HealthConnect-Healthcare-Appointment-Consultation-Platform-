"use strict";

/**
 * ApiResponse
 *
 * Responsibility:
 *   Format successful JSON responses using a consistent envelope.
 *   Format error responses matching the standardized error structures.
 */
class ApiResponse {
  constructor(statusCode, success, data, message, error = null) {
    this.statusCode = statusCode;
    this.success = success;
    if (message !== undefined && message !== null) {
      this.message = message;
    }
    if (data !== undefined && data !== null) {
      this.data = data;
    }
    if (error !== undefined && error !== null) {
      this.error = error;
    }
  }

  /**
   * Factory method for success responses (status 200/201).
   *
   * @param {Object|Array} data - Payload
   * @param {string} [message="Success"] - User-facing message
   * @param {number} [statusCode=200] - HTTP status code
   * @returns {ApiResponse}
   */
  static success(data, message = "Success", statusCode = 200) {
    return new ApiResponse(statusCode, true, data, message);
  }

  /**
   * Factory method for error responses (status 400-599).
   *
   * @param {string} message - Error description
   * @param {number} [statusCode=500] - HTTP status code
   * @param {string} [errorCode="INTERNAL_ERROR"] - Standard machine-readable error code
   * @returns {ApiResponse}
   */
  static error(message, statusCode = 500, errorCode = "INTERNAL_ERROR") {
    return new ApiResponse(statusCode, false, null, null, {
      code: errorCode,
      message: message,
    });
  }
}

module.exports = ApiResponse;
