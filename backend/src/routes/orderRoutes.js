"use strict";

const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// Create pharmacy order (triggers split payout to vendor)
router.post("/orders/create", orderController.createOrder);

// Get patient orders
router.get("/orders/patient/:username", orderController.getPatientOrders);

// Get vendor orders
router.get("/orders/vendor/:vendorId", orderController.getVendorOrders);

// Dispatch order
router.post("/orders/dispatch", orderController.dispatchOrder);

// Receive order
router.post("/orders/receive", orderController.receiveOrder);

module.exports = router;
