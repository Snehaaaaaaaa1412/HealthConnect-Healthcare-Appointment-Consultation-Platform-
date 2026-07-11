"use strict";

const { ValidationError } = require("../utils/ApiError");

/**
 * Centalized Input Validation Middleware
 *
 * Validates req.body against a schema object containing validation rules.
 * Throws a ValidationError if any rules are violated.
 *
 * Example Schema:
 *   const schema = {
 *     username: { required: true, minLength: 3, maxLength: 30 },
 *     email: { required: true, type: "email" },
 *     role: { required: true, enum: ["user", "doctor", "vendor"] }
 *   };
 */
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      // 1. Required check
      if (rules.required && (value === undefined || value === null || String(value).trim() === "")) {
        errors.push(`Field '${field}' is required.`);
        continue;
      }

      // If value is empty and not required, skip further validations
      if (value === undefined || value === null || String(value).trim() === "") {
        continue;
      }

      // 2. String length limits
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (rules.minLength && trimmed.length < rules.minLength) {
          errors.push(`Field '${field}' must be at least ${rules.minLength} characters long.`);
        }
        if (rules.maxLength && trimmed.length > rules.maxLength) {
          errors.push(`Field '${field}' must not exceed ${rules.maxLength} characters.`);
        }
      }

      // 3. Email format check
      if (rules.type === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`Field '${field}' must be a valid email address.`);
        }
      }

      // 4. Mobile phone number format check (typically 10 digits in our seed accounts)
      if (rules.type === "phone") {
        const phoneRegex = /^\d{10,12}$/;
        if (!phoneRegex.test(value)) {
          errors.push(`Field '${field}' must be a valid 10-to-12 digit phone number.`);
        }
      }

      // 5. Allowed set of values (enum)
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`Field '${field}' must be one of [${rules.enum.join(", ")}].`);
      }

      // 6. Numeric bounds check
      if (rules.type === "number") {
        const num = parseFloat(value);
        if (isNaN(num)) {
          errors.push(`Field '${field}' must be a valid number.`);
        } else {
          if (rules.min !== undefined && num < rules.min) {
            errors.push(`Field '${field}' must be at least ${rules.min}.`);
          }
          if (rules.max !== undefined && num > rules.max) {
            errors.push(`Field '${field}' must not exceed ${rules.max}.`);
          }
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(" "));
    }

    next();
  };
};

module.exports = validate;
