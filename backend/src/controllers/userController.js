"use strict";

const userService = require("../services/userService");
const asyncHandler = require("../utils/asyncHandler");

const userController = {
  /**
   * Get patient profile by username
   */
  getUserProfile: asyncHandler(async (req, res) => {
    const profile = await userService.getUserByUsername(req.params.username);
    if (!profile) return res.json({ error: "User not found" });
    return res.json(profile);
  })
};

module.exports = userController;
