"use strict";

const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const doctorRoutes = require("./doctorRoutes");
const vendorRoutes = require("./vendorRoutes");

// Mount extracted domain sub-routers
router.use(authRoutes);
router.use(userRoutes);
router.use(doctorRoutes);
router.use(vendorRoutes);

module.exports = router;
