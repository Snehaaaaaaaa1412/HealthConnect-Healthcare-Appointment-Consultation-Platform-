"use strict";

const express = require("express");
const router = express.Router();
const userService = require("../services/userService");
const asyncHandler = require("../utils/asyncHandler");

// GET /users/:username
router.get("/users/:username", asyncHandler(async (req, res) => {
  const profile = await userService.getUserByUsername(req.params.username);
  if (!profile) return res.json({ error: "User not found" });
  return res.json(profile);
}));

module.exports = router;
