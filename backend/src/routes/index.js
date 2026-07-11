"use strict";

const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const doctorRoutes = require("./doctorRoutes");
const vendorRoutes = require("./vendorRoutes");
const adminRoutes = require("./adminRoutes");
const appointmentRoutes = require("./appointmentRoutes");
const orderRoutes = require("./orderRoutes");
const chatRoutes = require("./chatRoutes");

// Mount extracted domain sub-routers
router.use(authRoutes);
router.use(userRoutes);
router.use(doctorRoutes);
router.use(vendorRoutes);
router.use(adminRoutes);
router.use(appointmentRoutes);
router.use(orderRoutes);
router.use(chatRoutes);

module.exports = router;
