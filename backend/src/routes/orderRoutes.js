"use strict";

const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const validate = require("../middleware/validationMiddleware");

// Validation Schemas
const createOrderSchema = {
  patientUsername: { required: true, minLength: 3 },
  patientFullName: { required: true, minLength: 3 },
  vendorId: { required: true, type: "number" },
  vendorStoreName: { required: true },
  vendorPhone: { required: true },
  items: { required: true },
  totalAmount: { required: true, type: "number", min: 0 },
  address: { required: true, minLength: 5 }
};

const orderIdSchema = {
  orderId: { required: true, type: "number" }
};

// Create pharmacy order (triggers split payout to vendor)
router.post("/orders/create", validate(createOrderSchema), orderController.createOrder);

// Get patient orders
router.get("/orders/patient/:username", orderController.getPatientOrders);

// Get vendor orders
router.get("/orders/vendor/:vendorId", orderController.getVendorOrders);

// Dispatch order
router.post("/orders/dispatch", validate(orderIdSchema), orderController.dispatchOrder);

// Receive order
router.post("/orders/receive", validate(orderIdSchema), orderController.receiveOrder);

module.exports = router;
