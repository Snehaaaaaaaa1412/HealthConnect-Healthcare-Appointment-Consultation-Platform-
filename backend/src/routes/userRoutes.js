"use strict";

const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// GET /users/:username
router.get("/users/:username", userController.getUserProfile);

module.exports = router;
