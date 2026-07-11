"use strict";

/**
 * asyncHandler
 *
 * Responsibility:
 *   Wraps asynchronous route handlers to catch unresolved Promises
 *   and propagate them automatically to Express's next middleware.
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
